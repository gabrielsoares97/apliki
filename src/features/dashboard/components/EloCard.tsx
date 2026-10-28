/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import { CardLink } from '../../../shared/components/CardParts';
import { colors, spacing, typography } from '../../../shared/theme';
import { ELO_BADGE_IMAGES } from '../../../shared/eloAssets';
import { EloProgress } from '../../../shared/eloCalc';

interface EloCardProps {
  progress: EloProgress | null;
  onPress: () => void;
}

export function EloCard({ progress, onPress }: EloCardProps) {
  if (!progress) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  const { tier, nextTier, progressToNext, pointsToNext, points } = progress;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Image source={ELO_BADGE_IMAGES[tier.level - 1]} style={styles.badge} />
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>Elo da saúde</Text>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.points}>{points} pontos</Text>
        </View>
      </View>

      {nextTier ? (
        <View style={{ marginTop: spacing.sm }}>
          <ProgressBar progress={progressToNext} />
          <Text style={styles.nextText}>
            Faltam {pointsToNext} pontos para {nextTier.name}
          </Text>
        </View>
      ) : (
        <Text style={styles.maxText}>Nível máximo alcançado! 👑</Text>
      )}

      <CardLink label="Ver níveis e como ganhar pontos" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  loadingCard: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 56, height: 56, resizeMode: 'contain' },
  tierName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  points: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  nextText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
  maxText: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
});
