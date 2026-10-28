/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { colors, spacing, typography } from '../../shared/theme';
import { ELO_BADGE_IMAGES } from '../../shared/eloAssets';
import { ELO_TIERS, EloProgress } from '../../shared/eloCalc';
import { getEloProgress } from './eloService';

export function EloDetailScreen() {
  const [progress, setProgress] = useState<EloProgress | null>(null);

  const load = useCallback(async () => {
    setProgress(await getEloProgress());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Quanto mais você registra e mantém a consistência (doses, peso, refeições, atividades e treinos), mais pontos você
          ganha e mais alto sobe seu elo.
        </Text>

        {progress && (
          <Card style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Image source={ELO_BADGE_IMAGES[progress.tier.level - 1]} style={styles.currentBadge} />
            <Text style={styles.currentTierName}>{progress.tier.name}</Text>
            <Text style={styles.currentPoints}>{progress.points} pontos</Text>
            {progress.nextTier && (
              <View style={{ width: '100%', marginTop: spacing.sm }}>
                <ProgressBar progress={progress.progressToNext} />
                <Text style={styles.nextText}>
                  Faltam {progress.pointsToNext} pontos para {progress.nextTier.name}
                </Text>
              </View>
            )}
          </Card>
        )}

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Todos os elos</Text>
        {ELO_TIERS.map((tier) => {
          const unlocked = !!progress && progress.points >= tier.minPoints;
          const isCurrent = progress?.tier.level === tier.level;
          return (
            <Card key={tier.level} style={[styles.tierRow, isCurrent && styles.tierRowCurrent]}>
              <Image source={ELO_BADGE_IMAGES[tier.level - 1]} style={[styles.tierBadge, !unlocked && styles.tierBadgeLocked]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.tierRowName, !unlocked && styles.tierRowNameLocked]}>
                  {tier.level}. {tier.name}
                </Text>
                <Text style={styles.tierRowDescription}>{tier.description}</Text>
                <Text style={styles.tierRowThreshold}>{tier.minPoints} pontos</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  description: { ...typography.small, lineHeight: 19 },
  currentBadge: { width: 100, height: 100, resizeMode: 'contain' },
  currentTierName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  currentPoints: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  nextText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  tierRowCurrent: { borderWidth: 2, borderColor: colors.primary },
  tierBadge: { width: 48, height: 48, resizeMode: 'contain' },
  tierBadgeLocked: { opacity: 0.3 },
  tierRowName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  tierRowNameLocked: { color: colors.textSecondary },
  tierRowDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tierRowThreshold: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
});
