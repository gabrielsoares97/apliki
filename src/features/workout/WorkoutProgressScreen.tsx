/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { ScreenState } from '../../shared/components/ScreenState';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { workoutSessionRepository } from '../../db/repositories';
import { WorkoutSession } from '../../types';
import { formatShortDatePt } from '../../shared/date';
import { getExerciseById } from '../../shared/exerciseCatalog';

const screenWidth = Dimensions.get('window').width;

export function WorkoutProgressScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await workoutSessionRepository.listAll();
      setSessions(all);
      setError(null);
    } catch {
      setError('Não foi possível carregar seu progresso. Verifique sua conexão e tente de novo.');
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

  const chartSessions = useMemo(() => [...sessions].reverse().slice(-10), [sessions]);
  const chartData = {
    labels: chartSessions.map((s) => formatShortDatePt(new Date(s.dateTime)).slice(0, 5)),
    datasets: [{ data: chartSessions.length > 0 ? chartSessions.map((s) => s.totalVolumeKg) : [0] }],
  };

  const totals = useMemo(
    () => ({
      sessions: sessions.length,
      volume: sessions.reduce((sum, s) => sum + s.totalVolumeKg, 0),
      calories: sessions.reduce((sum, s) => sum + s.caloriesEstimate, 0),
      minutes: sessions.reduce((sum, s) => sum + s.durationMin, 0),
    }),
    [sessions]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenState loading={loading} error={error} onRetry={retry} loadingMessage="Carregando seu progresso...">
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.statsRow, { marginTop: 0 }]}>
            <Card style={styles.statCard}>
              <Text style={typography.label}>Treinos</Text>
              <Text style={typography.big}>{totals.sessions}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={typography.label}>Volume total</Text>
              <Text style={typography.big}>{Math.round(totals.volume / 1000)}t</Text>
            </Card>
          </View>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={typography.label}>Tempo total</Text>
              <Text style={typography.big}>{Math.round(totals.minutes / 60)}h</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={typography.label}>Calorias</Text>
              <Text style={typography.big}>{totals.calories}</Text>
            </Card>
          </View>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>Volume por treino (kg)</Text>
            {chartSessions.length >= 2 ? (
              <LineChart
                data={chartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={200}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: () => colors.primary,
                  labelColor: () => colors.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                }}
                bezier
                style={{ borderRadius: radius.smd }}
              />
            ) : (
              <Text style={typography.small}>Registre ao menos dois treinos para ver o gráfico.</Text>
            )}
          </Card>

          <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Histórico</Text>
          {sessions.length === 0 && (
            <Card>
              <EmptyState
                icon="📈"
                title="Nenhum treino registrado ainda"
                description="Finalize um treino para ver aqui seu histórico, volume e calorias."
              />
            </Card>
          )}
          {sessions.map((session) => {
            const expanded = expandedId === session.id;
            return (
              <Card key={session.id} style={{ marginBottom: spacing.sm }} onPress={() => setExpandedId(expanded ? null : session.id)}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{session.name}</Text>
                    <Text style={styles.historyDetail}>
                      {formatShortDatePt(new Date(session.dateTime))} · {session.durationMin}min · {session.totalVolumeKg}kg · {session.caloriesEstimate}kcal
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
                </View>
                {expanded &&
                  session.exercises.map((logged, i) => (
                    <View key={`${logged.exerciseId}-${i}`} style={styles.exerciseBlock}>
                      <Text style={styles.exerciseTitle}>{getExerciseById(logged.exerciseId)?.name ?? 'Exercício'}</Text>
                      <Text style={styles.historyDetail}>
                        {logged.sets.map((s) => `${String(s.weightKg).replace('.', ',')}kg × ${s.reps}`).join('  ·  ')}
                      </Text>
                    </View>
                  ))}
              </Card>
            );
          })}
        </ScrollView>
      </ScreenState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statCard: { flex: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  chevron: { fontSize: 18, color: colors.textSecondary },
  exerciseBlock: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  exerciseTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  historyDetail: { ...typography.caption, marginTop: 2 },
});
