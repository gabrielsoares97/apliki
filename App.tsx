/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppStore } from './src/store/useAppStore';
import { useAuthStore } from './src/store/useAuthStore';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { OnboardingWizard } from './src/features/onboarding/OnboardingWizard';
import { colors, isDarkTheme, spacing, typography } from './src/shared/theme';
import { cancelAllNotifications, ensureNotificationPermission } from './src/notifications/notifications';
import { resyncNotifications } from './src/notifications/sync';
import { clearLocalPhotoCache, migrateLegacyPhotos } from './src/features/weight/photoStore';
import { isFirebaseConfigured } from './src/firebase/config';
import { AppLockGate } from './src/shared/components/AppLockGate';
import { DialogHost } from './src/shared/dialog';
import { ToastHost } from './src/shared/toast';
import { initNotificationActions } from './src/notifications/notificationActions';
import { clearPendingActions, flushPendingActions, saveQuickActionSettings } from './src/notifications/pendingActions';
import { useSubscriptionStore } from './src/store/useSubscriptionStore';
import { hasAccess, touchAccount } from './src/firebase/subscription';
import { SubscriptionScreen } from './src/features/subscription/SubscriptionScreen';
import { signOutUser } from './src/firebase/auth';

export default function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseSetupNeeded />;
  }
  return (
    <>
      <AuthGate />
      <DialogHost />
    </>
  );
}

function AuthGate() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const authLoading = useAuthStore((s) => s.authLoading);
  const startListening = useAuthStore((s) => s.startListening);

  const appLoading = useAppStore((s) => s.loading);
  const loadError = useAppStore((s) => s.loadError);
  const user = useAppStore((s) => s.user);
  const medication = useAppStore((s) => s.medication);
  const loadForUser = useAppStore((s) => s.loadForUser);
  const clear = useAppStore((s) => s.clear);

  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const subscriptionLoading = useSubscriptionStore((s) => s.loading);

  useEffect(() => {
    const unsubscribe = startListening();
    return unsubscribe;
  }, [startListening]);

  useEffect(() => initNotificationActions(), []);

  // Guarda o tamanho do copo para o botao "+ 1 copo" da notificacao e envia o que ficou na fila
  // (acoes tocadas com o app fechado) ao abrir o app e sempre que ele volta para o primeiro plano.
  useEffect(() => {
    if (user) saveQuickActionSettings({ cupSizeMl: user.cupSizeMl, goalMl: user.dailyWaterGoalMl });
  }, [user?.cupSizeMl, user?.dailyWaterGoalMl]);

  useEffect(() => {
    if (!firebaseUser) return;
    const flush = () => {
      flushPendingActions()
        .then((result) => {
          if (result.flushed > 0) {
            useAppStore.getState().bump();
            useAppStore.getState().refreshUser().catch(() => undefined);
          }
        })
        .catch(() => undefined);
    };
    flush();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') flush();
    });
    return () => subscription.remove();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (firebaseUser) {
      loadForUser(firebaseUser.uid, firebaseUser.displayName ?? '');
      ensureNotificationPermission();
    } else if (!authLoading) {
      clear();
      useSubscriptionStore.getState().clear();
      // Sem conta conectada nao pode sobrar lembrete da conta anterior tocando no aparelho.
      cancelAllNotifications();
      // Nada da conta anterior pode ficar no aparelho: fila de ações rápidas e fotos em cache.
      clearPendingActions().catch(() => undefined);
      clearLocalPhotoCache();
    }
  }, [firebaseUser, authLoading, loadForUser, clear]);

  // Reagenda tudo a cada abertura e sempre que uma preferencia muda: agenda o que falta, cancela o que
  // sobrou (lembrete apagado, interruptor desligado) e mantem tudo em dia se o horario do aparelho mudou.
  // Sem assinatura válida os lembretes saem do aparelho: as ações rápidas deles não conseguiriam gravar nada.
  useEffect(() => {
    if (!user || subscriptionLoading) return;
    if (hasAccess(subscriptionStatus)) resyncNotifications();
    else cancelAllNotifications();
  }, [
    subscriptionStatus,
    subscriptionLoading,
    user?.id,
    user?.notifyDose,
    user?.notifyWater,
    user?.notifyMeal,
    user?.notifyActivity,
    medication?.nextDoseAt,
    medication?.name,
  ]);

  // Assinatura em tempo real (o admin ativa e o app libera na hora). Começa depois do carregamento do perfil,
  // que já garantiu o teste grátis na primeira entrada; também atualiza a ficha da conta para o painel.
  useEffect(() => {
    if (!firebaseUser || !user) return;
    touchAccount(firebaseUser, user.name).catch(() => undefined);
    return useSubscriptionStore.getState().startListening(firebaseUser.uid);
  }, [firebaseUser?.uid, user?.id]);

  // Ao voltar para a frente: o teste pode ter vencido com o app aberto, e os lembretes são reagendados
  // (dia pulado que já passou, relógio ou fuso do aparelho alterados).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      useSubscriptionStore.getState().recompute();
      if (useAppStore.getState().user && hasAccess(useSubscriptionStore.getState().status)) resyncNotifications();
    });
    // Com o app aberto em primeiro plano, confere o vencimento a cada minuto.
    const timer = setInterval(() => useSubscriptionStore.getState().recompute(), 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  // Fotos de progresso registradas antes de irem para a nuvem: envia enquanto ainda existem no aparelho.
  useEffect(() => {
    if (user) migrateLegacyPhotos();
  }, [user?.id]);

  if (firebaseUser && loadError) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupIcon}>⚠️</Text>
        <Text style={typography.title}>Não foi possível carregar seus dados</Text>
        <Text style={styles.setupText}>{loadError}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => loadForUser(firebaseUser.uid, firebaseUser.displayName ?? '')}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
        <Pressable style={styles.signOutButton} onPress={() => signOutUser()} accessibilityRole="button">
          <Text style={styles.signOutText}>Sair da conta</Text>
        </Pressable>
      </View>
    );
  }

  if (authLoading || (firebaseUser && (appLoading || (user && subscriptionLoading)))) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Preparando o apliKI...</Text>
      </View>
    );
  }

  const showOnboarding = !!firebaseUser && !!user && !user.onboardingCompleted;
  // Só uma tela de aviso: quem garante o bloqueio são as regras do Firestore e o Worker da IA.
  const showPaywall = !!firebaseUser && !!user && !hasAccess(subscriptionStatus);

  const navigationTheme = {
    ...(isDarkTheme ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkTheme ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        {!firebaseUser ? (
          <AuthNavigator />
        ) : (
          <AppLockGate>
            {showPaywall ? <SubscriptionScreen /> : showOnboarding ? <OnboardingWizard /> : <RootNavigator />}
          </AppLockGate>
        )}
      </NavigationContainer>
      <ToastHost />
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

function FirebaseSetupNeeded() {
  return (
    <View style={styles.setupContainer}>
      <Text style={styles.setupIcon}>🔧</Text>
      <Text style={typography.title}>Configuração do Firebase pendente</Text>
      <Text style={styles.setupText}>
        Para usar login e sincronização na nuvem, edite{'\n'}
        <Text style={styles.setupCode}>src/firebase/config.ts</Text>
        {'\n'}e cole as chaves do seu projeto Firebase (Configurações do projeto → Seus apps → app Web).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  setupContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.sm },
  setupIcon: { fontSize: 40, marginBottom: spacing.sm },
  setupText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  setupCode: { fontFamily: 'monospace', color: colors.primary, fontWeight: '700' },
  retryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  retryButtonText: { color: colors.onPrimary, fontWeight: '700' },
  signOutButton: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  signOutText: { color: colors.textSecondary, fontWeight: '600' },
});
