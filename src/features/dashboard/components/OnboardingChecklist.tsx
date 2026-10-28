/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import { IconButton } from '../../../shared/components/IconButton';
import { colors, spacing, typography } from '../../../shared/theme';

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  onPress: () => void;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
}

export function OnboardingChecklist({ items, onDismiss }: OnboardingChecklistProps) {
  const doneCount = items.filter((i) => i.done).length;

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.header}>
        <Text style={typography.subtitle}>Primeiros passos — {doneCount}/{items.length}</Text>
        <IconButton icon="✕" iconSize={16} size={32} onPress={onDismiss} accessibilityLabel="Fechar primeiros passos" />
      </View>
      <ProgressBar progress={doneCount / items.length} />
      <View style={{ marginTop: spacing.sm }}>
        {items.map((item) => (
          <Pressable key={item.key} style={styles.item} onPress={item.onPress} disabled={item.done}>
            <View style={[styles.bullet, item.done && styles.bulletDone]}>
              {item.done && <Text style={styles.bulletCheck}>✓</Text>}
            </View>
            <Text style={[styles.itemLabel, item.done && styles.itemLabelDone]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2, gap: spacing.sm },
  bullet: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bulletDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  bulletCheck: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
  itemLabel: { fontSize: 14, color: colors.textPrimary },
  itemLabelDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
});
