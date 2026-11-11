/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Alert } from '../../shared/dialog';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { SUBSCRIPTION_CONTACT } from '../../shared/subscriptionContact';
import { formatBRL, monthlyCents, PLAN_NAMES, yearlySavingsPercent, type Plan, type PlanId } from '../../shared/plans';
import { BillingError, getBillingConfig, openBillingPortal, startCheckout, type BillingConfig } from '../../firebase/billing';

const BENEFITS = [
  'Doses, peso, água, refeições e treinos em um só lugar',
  'Análise de refeições por inteligência artificial',
  'Lembretes de dose, água e suplementos',
  'Fotos de progresso com antes e depois',
  'Relatório em PDF para levar ao médico',
];

/** Escolha do plano e ida para o pagamento. Sem a cobrança online ligada, mostra os contatos para assinar. */
export function PlansView() {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [selected, setSelected] = useState<PlanId>('anual');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let alive = true;
    getBillingConfig().then((value) => alive && setConfig(value));
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubscribe() {
    if (opening) return;
    setOpening(true);
    try {
      await startCheckout(selected);
    } catch (error) {
      if (error instanceof BillingError && error.code === 'already_subscribed') {
        // Já existe assinatura paga nesta conta: o lugar certo é o portal (trocar cartão, reativar, mudar de plano).
        await openBillingPortal().catch(() => Alert.alert('Assinatura', error.message));
      } else {
        Alert.alert('Não foi possível abrir o pagamento', error instanceof Error ? error.message : 'Tente novamente.');
      }
    } finally {
      setOpening(false);
    }
  }

  if (!config) {
    return (
      <View style={styles.loading} accessibilityLabel="Carregando planos">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const savings = yearlySavingsPercent(config.plans);

  return (
    <View style={styles.container}>
      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Text style={styles.check} accessibilityElementsHidden importantForAccessibility="no">
              ✓
            </Text>
            <Text style={styles.benefit}>{benefit}</Text>
          </View>
        ))}
      </View>

      {config.configured ? (
        <>
          <View accessibilityRole="radiogroup" style={styles.plans}>
            {[...config.plans]
              // Anual primeiro: é o plano em destaque.
              .sort((a, b) => (a.interval === b.interval ? 0 : a.interval === 'year' ? -1 : 1))
              .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selected === plan.id}
                savings={plan.interval === 'year' ? savings : 0}
                onPress={() => setSelected(plan.id)}
              />
            ))}
          </View>
          <Button label="Assinar agora" onPress={handleSubscribe} loading={opening} />
          <Text style={styles.finePrint}>
            Pagamento seguro pela Stripe. Renova automaticamente e você cancela quando quiser, direto no app.
          </Text>
        </>
      ) : (
        <ContactOptions plans={config.plans} />
      )}
    </View>
  );
}

function PlanCard({ plan, selected, savings, onPress }: { plan: Plan; selected: boolean; savings: number; onPress: () => void }) {
  const yearly = plan.interval === 'year';
  const price = `${formatBRL(plan.amount)} ${yearly ? 'por ano' : 'por mês'}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Plano ${PLAN_NAMES[plan.id]}, ${price}${savings > 0 ? `, economize ${savings}%` : ''}`}
      style={[styles.plan, selected && styles.planSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
      <View style={styles.planBody}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planName}>{PLAN_NAMES[plan.id]}</Text>
          {savings > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Economize {savings}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.planPrice}>{price}</Text>
        {yearly && <Text style={styles.planHint}>Equivale a {formatBRL(monthlyCents(plan))} por mês</Text>}
      </View>
    </Pressable>
  );
}

/** Enquanto o pagamento online não está ligado, a assinatura é combinada direto com o apliKI. */
function ContactOptions({ plans }: { plans: Plan[] }) {
  const message = encodeURIComponent('Olá! Quero assinar o apliKI.');
  const summary = plans
    .map((plan) => `${PLAN_NAMES[plan.id]}: ${formatBRL(plan.amount)}${plan.interval === 'year' ? '/ano' : '/mês'}`)
    .join('  ·  ');
  return (
    <View style={styles.contact}>
      <Text style={styles.contactPrices}>{summary}</Text>
      {SUBSCRIPTION_CONTACT.whatsapp ? (
        <Button
          label="Assinar pelo WhatsApp"
          onPress={() => Linking.openURL(`https://wa.me/${SUBSCRIPTION_CONTACT.whatsapp}?text=${message}`)}
        />
      ) : null}
      {SUBSCRIPTION_CONTACT.email ? (
        <Button
          label="Assinar por e-mail"
          variant={SUBSCRIPTION_CONTACT.whatsapp ? 'secondary' : 'primary'}
          onPress={() => Linking.openURL(`mailto:${SUBSCRIPTION_CONTACT.email}?subject=Assinatura%20apliKI`)}
        />
      ) : null}
      <Text style={styles.finePrint}>Depois da confirmação, o acesso é liberado sozinho em poucos segundos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  benefits: { gap: spacing.sm },
  benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  check: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  benefit: { ...typography.body, flex: 1, lineHeight: 20 },
  plans: { gap: spacing.sm },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 72,
  },
  planSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  planBody: { flex: 1, gap: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  planName: { ...typography.subtitle },
  planPrice: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  planHint: { ...typography.caption },
  badge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
  finePrint: { ...typography.caption, textAlign: 'center', lineHeight: 17 },
  contact: { gap: spacing.sm },
  contactPrices: { ...typography.small, textAlign: 'center', color: colors.textPrimary, fontWeight: '700' },
});
