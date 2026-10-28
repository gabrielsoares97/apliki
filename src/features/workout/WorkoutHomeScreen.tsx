/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState, LoadingState } from '../../shared/components/ScreenState';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { workoutSessionRepository } from '../../db/repositories';
import { MuscleGroup, WorkoutSession } from '../../types';
import { MuscleIcon } from '../../shared/components/MuscleIcon';
import { computeMuscleRecovery } from '../../shared/workoutCalc';
import { MUSCLE_GROUP_LABELS } from '../../shared/labels';
import { formatShortDatePt } from '../../shared/date';

/** Nomes curtos para caber em 4 colunas. */
const MUSCLE_GROUP_SHORT_LABELS: Partial<Record<MuscleGroup, string>> = {
  posterior: 'Posterior',
  quadriceps: 'Quadríceps',
  panturrilha: 'Panturrilha',
  corpo_todo: 'Corpo todo',
};

const RECOVERY_COLORS: Record<string, string> = {
  descansado: colors.primary,
  recuperando: colors.warning,
  fadigado: colors.danger,
};

/** Cor do TEXTO do status: o amarelo de preenchimento nao tem contraste suficiente como texto. */
const RECOVERY_TEXT_COLORS: Record<string, string> = {
  ...RECOVERY_COLORS,
  recuperando: colors.warningText,
};

const RECOVERY_LABELS: Record<string, string> = {
  descansado: 'Descansado',
  recuperando: 'Recuperando',
  fadigado: 'Treinado hoje',
};

export function WorkoutHomeScreen() {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  // Carregando so ate a primeira resposta; recargas (foco) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await workoutSessionRepository.listAll();
      setSessions(all);
      setError(null);
    } catch {
      setError('Não foi possível carregar seus treinos. Verifique sua conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const recovery = computeMuscleRecovery(sessions);
  const recentSessions = sessions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Treino</Text>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Recuperação muscular</Text>
        {loading ? (
          <LoadingState message="Carregando seus treinos..." fullScreen={false} style={styles.state} />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} fullScreen={false} style={styles.state} />
        ) : (
          <>
            <View style={styles.recoveryGrid}>
              {recovery.map((r) => (
                <View
                  key={r.muscleGroup}
                  style={styles.recoveryTile}
                  accessible
                  accessibilityLabel={`${MUSCLE_GROUP_LABELS[r.muscleGroup]}: ${RECOVERY_LABELS[r.status]}`}
                >
                  <MuscleIcon muscleGroup={r.muscleGroup} color={RECOVERY_COLORS[r.status]} size={40} />
                  <Text style={styles.recoveryLabel} numberOfLines={1}>{MUSCLE_GROUP_SHORT_LABELS[r.muscleGroup] ?? MUSCLE_GROUP_LABELS[r.muscleGroup]}</Text>
                  <Text style={[styles.recoveryStatus, { color: RECOVERY_TEXT_COLORS[r.status] }]} numberOfLines={1}>{RECOVERY_LABELS[r.status]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendRow}>
              {Object.keys(RECOVERY_LABELS).map((status) => (
                <View key={status} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RECOVERY_COLORS[status] }]} />
                  <Text style={styles.legendText}>{RECOVERY_LABELS[status]}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.actionsGrid}>
          <ActionCard emoji="⚡" label="Treino rápido" onPress={() => navigation.navigate('QuickWorkout')} />
          <ActionCard emoji="📋" label="Meus treinos" onPress={() => navigation.navigate('MyWorkouts')} />
          <ActionCard emoji="🔍" label="Biblioteca de exercícios" onPress={() => navigation.navigate('ExerciseLibrary')} />
          <ActionCard emoji="📚" label="Programas" onPress={() => navigation.navigate('Programs')} />
          <ActionCard emoji="🤖" label="Plano automático" onPress={() => navigation.navigate('SmartPlan')} />
          <ActionCard emoji="📈" label="Progresso" onPress={() => navigation.navigate('WorkoutProgress')} />
        </View>

        {/* Enquanto carrega (ou se falhou) o aviso fica la em cima, na recuperacao muscular. */}
        {!loading && !error && (
          <>
            <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Treinos recentes</Text>
            {recentSessions.length === 0 && (
              <Card>
                <EmptyState
                  icon="🏋️"
                  title="Nenhum treino registrado ainda"
                  description="Comece por um Treino rápido ou monte o seu em Meus treinos."
                />
              </Card>
            )}
            {recentSessions.map((session) => (
              <Card key={session.id} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionDetail}>
                  {formatShortDatePt(new Date(session.dateTime))} · {session.durationMin}min · {session.totalVolumeKg}kg
                </Text>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  recoveryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  recoveryTile: {
    width: '23.5%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  recoveryLabel: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: 4 },
  recoveryStatus: { fontSize: 9, fontWeight: '600', marginTop: 1, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textSecondary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  actionCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  sessionName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  sessionDetail: { ...typography.caption, marginTop: 2 },
  state: { paddingVertical: spacing.lg },
});
