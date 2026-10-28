/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../shared/theme';
import { Achievement } from '../achievements';

interface AchievementsRowProps {
  achievements: Achievement[];
}

export function AchievementsRow({ achievements }: AchievementsRowProps) {
  if (achievements.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.content}>
      {achievements.map((a) => (
        <View key={a.key} style={[styles.badge, !a.unlocked && styles.badgeLocked]}>
          <Text style={[styles.emoji, !a.unlocked && styles.emojiLocked]}>{a.emoji}</Text>
          <Text style={[styles.label, !a.unlocked && styles.labelLocked]}>{a.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: spacing.md },
  content: { gap: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minWidth: 76,
  },
  badgeLocked: { backgroundColor: colors.background, opacity: 0.6 },
  emoji: { fontSize: 22 },
  emojiLocked: { opacity: 0.4 },
  label: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 2 },
  labelLocked: { color: colors.textSecondary },
});
