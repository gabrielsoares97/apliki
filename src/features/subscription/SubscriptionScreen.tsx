/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../shared/components/Button';
import { colors, isDarkTheme, radius, spacing, typography } from '../../shared/theme';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { signOutUser } from '../../firebase/auth';
import { exportCsv } from '../profile/export';
import { Alert } from '../../shared/dialog';
import { DeleteAccountModal } from '../profile/DeleteAccountModal';
import { PlansView } from './PlansView';
import { syncBilling } from '../../firebase/billing';

const LOGO = isDarkTheme ? require('../../../assets/logo-dark.png') : require('../../../assets/logo.png');

/** Mostrada quando o teste grátis ou a assinatura venceu. Os dados continuam guardados e podem ser exportados. */
export function SubscriptionScreen() {
  const status = useSubscriptionStore((s) => s.status);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const [exporting, setExporting] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  // Quem chega aqui pagando (o aviso da Stripe atrasou, ou uma liberação manual venceu antes) é liberado na hora.
  useEffect(() => {
    syncBilling();
  }, []);

  const trialEnded = subscription?.plan === 'trial';
  const title = trialEnded
    ? 'Seu teste grátis terminou'
    : status === 'canceled'
      ? 'Sua assinatura foi cancelada'
      : 'Seu acesso ao apliKI venceu';
  const subtitle =
    status === 'none'
      ? 'Não encontramos uma assinatura para esta conta.'
      : 'Seus registros continuam guardados. Assine para voltar a registrar e usar a IA.';

  async function handleExport() {
    setExporting(true);
    try {
      await exportCsv();
    } catch {
      Alert.alert('Não foi possível exportar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="apliKI" />
        <Text style={[typography.title, styles.center]} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.subtitle, styles.center]}>{subtitle}</Text>

        <View style={styles.card}>
          <PlansView />
        </View>

        <View style={styles.actions}>
          <Text style={[styles.hint, styles.center]}>
            Depois do pagamento, o acesso volta sozinho em poucos segundos — não precisa sair da conta.
          </Text>
          <Button label="Exportar meus dados (CSV)" variant="secondary" loading={exporting} onPress={handleExport} />
          <Button label="Sair da conta" variant="ghost" onPress={() => signOutUser()} />
          <Button label="Excluir minha conta" variant="ghost" onPress={() => setDeleteVisible(true)} />
        </View>
        <DeleteAccountModal visible={deleteVisible} onClose={() => setDeleteVisible(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl, width: '100%', maxWidth: 520, alignSelf: 'center' },
  logo: { width: 84, height: 100, alignSelf: 'center', marginTop: spacing.md },
  center: { textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md },
  actions: { gap: spacing.sm },
  hint: { ...typography.label, lineHeight: 18 },
});
