/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { Alert } from '../../shared/dialog';
import { colors, spacing, typography } from '../../shared/theme';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { openBillingPortal } from '../../firebase/billing';
import { PlansView } from './PlansView';
import { summarizeSubscription } from './subscriptionSummary';

/** Linha curta da assinatura, para o cabeçalho da seção no Perfil. */
export function useSubscriptionHint(): string {
  const subscription = useSubscriptionStore((s) => s.subscription);
  const status = useSubscriptionStore((s) => s.status);
  const hasPaid = useSubscriptionStore((s) => s.hasPaidSubscription);
  return summarizeSubscription(subscription, status, hasPaid).hint;
}

/** Situação da assinatura com a ação certa: assinar (abre os planos) ou gerenciar (portal de pagamento). */
export function SubscriptionSection() {
  const subscription = useSubscriptionStore((s) => s.subscription);
  const status = useSubscriptionStore((s) => s.status);
  const [plansVisible, setPlansVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const hasPaid = useSubscriptionStore((s) => s.hasPaidSubscription);
  const summary = summarizeSubscription(subscription, status, hasPaid);

  async function handleManage() {
    if (opening) return;
    setOpening(true);
    try {
      await openBillingPortal();
    } catch (error) {
      Alert.alert('Não foi possível abrir', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.detail}>{summary.detail}</Text>
      {summary.action === 'subscribe' && <Button label="Ver planos e assinar" onPress={() => setPlansVisible(true)} />}
      {summary.action === 'manage' && (
        <Button label="Gerenciar assinatura" variant="secondary" onPress={handleManage} loading={opening} />
      )}
      <ModalSheet visible={plansVisible} title="Assinar o apliKI" onClose={() => setPlansVisible(false)}>
        <PlansView />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  detail: { ...typography.small, color: colors.textSecondary, lineHeight: 19 },
});
