/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { colors, radius, spacing } from '../../shared/theme';
import { daysLeft } from '../../firebase/subscription';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { PlansView } from './PlansView';

/** Aviso do Início durante o teste grátis: quanto falta e o atalho para assinar. Some depois da assinatura. */
export function TrialBanner() {
  const status = useSubscriptionStore((s) => s.status);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const [plansVisible, setPlansVisible] = useState(false);

  if (status !== 'trial') return null;
  const remaining = daysLeft(subscription) ?? 0;
  const text =
    remaining === 0 ? 'Seu teste grátis termina hoje' : remaining === 1 ? 'Falta 1 dia de teste grátis' : `Faltam ${remaining} dias de teste grátis`;

  return (
    <>
      <Pressable
        onPress={() => setPlansVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${text}. Ver planos`}
        style={({ pressed }) => [styles.banner, remaining <= 2 && styles.urgent, pressed && styles.pressed]}
      >
        <Text style={styles.text}>{text}</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Ver planos</Text>
        </View>
      </Pressable>
      <ModalSheet visible={plansVisible} title="Assinar o apliKI" onClose={() => setPlansVisible(false)}>
        <PlansView />
      </ModalSheet>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  urgent: { borderColor: colors.warning },
  pressed: { opacity: 0.85 },
  text: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  cta: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  ctaText: { color: colors.onPrimary, fontSize: 12, fontWeight: '800' },
});
