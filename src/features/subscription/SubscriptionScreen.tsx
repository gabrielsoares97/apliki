/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../shared/components/Button';
import { colors, isDarkTheme, radius, spacing, typography } from '../../shared/theme';
import { SUBSCRIPTION_CONTACT } from '../../shared/subscriptionContact';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { signOutUser } from '../../firebase/auth';
import { exportCsv } from '../profile/export';
import { Alert } from '../../shared/dialog';
import { DeleteAccountModal } from '../profile/DeleteAccountModal';

const LOGO = isDarkTheme ? require('../../../assets/logo-dark.png') : require('../../../assets/logo.png');

const BENEFITS = [
  'Registro de doses, peso, água, refeições e treinos',
  'Análise de refeições por inteligência artificial',
  'Lembretes inteligentes de dose, água e suplementos',
  'Fotos de progresso e comparação de antes e depois',
  'Seus dados sincronizados com segurança na nuvem',
];

/** Mostrada quando o teste grátis ou a assinatura venceu. Os dados continuam guardados e podem ser exportados. */
export function SubscriptionScreen() {
  const status = useSubscriptionStore((s) => s.status);
  const [exporting, setExporting] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const title = status === 'canceled' ? 'Sua assinatura foi cancelada' : 'Seu acesso ao apliKI venceu';
  const subtitle =
    status === 'none'
      ? 'Não encontramos uma assinatura para esta conta.'
      : 'Seus registros continuam guardados. Assine para voltar a registrar e usar a IA.';

  const whatsappMessage = encodeURIComponent('Olá! Quero assinar o apliKI.');

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
          <Text style={styles.cardTitle}>O que a assinatura inclui</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Text style={styles.check} accessibilityElementsHidden importantForAccessibility="no">
                ✓
              </Text>
              <Text style={styles.benefit}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {SUBSCRIPTION_CONTACT.whatsapp ? (
            <Button
              label="Assinar pelo WhatsApp"
              onPress={() => Linking.openURL(`https://wa.me/${SUBSCRIPTION_CONTACT.whatsapp}?text=${whatsappMessage}`)}
            />
          ) : null}
          {SUBSCRIPTION_CONTACT.email ? (
            <Button
              label="Assinar por e-mail"
              variant={SUBSCRIPTION_CONTACT.whatsapp ? 'secondary' : 'primary'}
              onPress={() => Linking.openURL(`mailto:${SUBSCRIPTION_CONTACT.email}?subject=Assinatura%20apliKI`)}
            />
          ) : null}
          <Text style={[styles.hint, styles.center]}>
            Depois da confirmação, o acesso volta sozinho em poucos segundos — não precisa sair da conta.
          </Text>
          <Button
            label={exporting ? 'Exportando...' : 'Exportar meus dados (CSV)'}
            variant="secondary"
            disabled={exporting}
            onPress={handleExport}
          />
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  logo: { width: 84, height: 100, alignSelf: 'center', marginTop: spacing.md },
  center: { textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 20 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  cardTitle: { ...typography.subtitle, marginBottom: spacing.xs },
  benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  check: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  benefit: { ...typography.body, flex: 1, lineHeight: 20 },
  actions: { gap: spacing.sm },
  hint: { ...typography.label, lineHeight: 18 },
});
