/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { colors, radius, shadow, spacing, typography } from '../../../shared/theme';
import { FocusItem } from '../focus';

interface FocusCardProps {
  items: FocusItem[];
  onAction: (item: FocusItem) => void;
}

/** "O que fazer agora": um destaque principal e ate duas proximas tarefas, ou o estado de tudo em dia. */
export function FocusCard({ items, onAction }: FocusCardProps) {
  if (items.length === 0) {
    return (
      <View style={[styles.card, styles.doneCard]}>
        <Text style={styles.doneIcon}>🎉</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.doneTitle}>Tudo em dia por agora</Text>
          <Text style={styles.doneSubtitle}>Você está acompanhando bem seu tratamento hoje.</Text>
        </View>
      </View>
    );
  }

  const [main, ...rest] = items;
  const next = rest.slice(0, 2);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>AGORA</Text>
      <View style={styles.mainRow}>
        <Text style={styles.mainIcon}>{main.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{main.title}</Text>
          <Text style={styles.subtitle}>{main.subtitle}</Text>
        </View>
      </View>
      <Button label={main.actionLabel} onPress={() => onAction(main)} style={styles.mainButton} />

      {next.length > 0 && (
        <View style={styles.nextList}>
          <Text style={styles.nextLabel}>Depois</Text>
          {next.map((item) => (
            <Pressable
              key={item.key}
              style={styles.nextRow}
              onPress={() => onAction(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.actionLabel}`}
            >
              <Text style={styles.nextIcon}>{item.icon}</Text>
              <Text style={styles.nextTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.nextAction}>{item.actionLabel} ›</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadow,
  },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: colors.primary, marginBottom: spacing.sm },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mainIcon: { fontSize: 34 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  subtitle: { ...typography.small, marginTop: 2, lineHeight: 18 },
  mainButton: { marginTop: spacing.md },
  nextList: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  nextLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs + 2, minHeight: 44 },
  nextIcon: { fontSize: 16 },
  nextTitle: { flex: 1, fontSize: 13, color: colors.textPrimary },
  nextAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  doneIcon: { fontSize: 30 },
  doneTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  doneSubtitle: { ...typography.caption, marginTop: 2 },
});
