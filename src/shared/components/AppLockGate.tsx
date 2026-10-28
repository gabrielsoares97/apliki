/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, AppState, AppStateStatus, Modal } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { authenticateWithBiometrics, getBiometricLockEnabled } from '../appLock';

interface AppLockGateProps {
  children: React.ReactNode;
}

/**
 * So bloqueia de novo se o app ficou mais que isso em segundo plano: abrir a galeria, a camera ou a
 * folha de compartilhar tambem manda o app para o segundo plano e nao deve pedir a biometria na volta.
 */
const LOCK_GRACE_MS = 30000;

export function AppLockGate({ children }: AppLockGateProps) {
  const [enabled, setEnabled] = useState(false);
  const [checkedEnabled, setCheckedEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const backgroundSince = useRef<number | null>(null);

  const tryUnlock = useCallback(async () => {
    setAuthenticating(true);
    const success = await authenticateWithBiometrics();
    setAuthenticating(false);
    if (success) setUnlocked(true);
  }, []);

  useEffect(() => {
    getBiometricLockEnabled()
      .catch(() => false)
      .then((value) => {
        setEnabled(value);
        setCheckedEnabled(true);
        if (!value) setUnlocked(true);
      });
  }, []);

  useEffect(() => {
    // Em segundo plano o pedido de biometria falharia: espera a volta para o primeiro plano.
    if (checkedEnabled && enabled && !unlocked && AppState.currentState !== 'background') tryUnlock();
  }, [checkedEnabled, enabled, unlocked, tryUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && backgroundSince.current === null) {
        backgroundSince.current = Date.now();
      } else if (nextState === 'active') {
        const since = backgroundSince.current;
        backgroundSince.current = null;
        if (enabled && since !== null && Date.now() - since > LOCK_GRACE_MS) setUnlocked(false);
      }
    });
    return () => subscription.remove();
  }, [enabled]);

  if (!checkedEnabled) return null;

  // O bloqueio fica por cima das telas, que continuam montadas: formularios, treino em andamento e fotos
  // escolhidas nao se perdem. Modal para cobrir tambem as janelas (ModalSheet) que estiverem abertas.
  return (
    <>
      {children}
      <Modal visible={enabled && !unlocked} animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
        <View style={styles.container}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={typography.title}>apliKI bloqueado</Text>
          <Text style={styles.subtitle}>Use sua biometria para acessar seus dados de saúde.</Text>
          <Pressable style={styles.button} onPress={tryUnlock} disabled={authenticating}>
            <Text style={styles.buttonText}>{authenticating ? 'Verificando...' : 'Desbloquear'}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.sm },
  icon: { fontSize: 40, marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, marginBottom: spacing.md },
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg },
  buttonText: { color: colors.white, fontWeight: '700' },
});
