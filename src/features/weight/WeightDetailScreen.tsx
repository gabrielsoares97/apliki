/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native';
import { ProgressPhoto } from './ProgressPhoto';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from '../../shared/components/Card';
import { BmiGauge } from '../../shared/components/BmiGauge';
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ScreenState } from '../../shared/components/ScreenState';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { weightRepository } from '../../db/repositories';
import { useAppStore } from '../../store/useAppStore';
import { WeightLog } from '../../types';
import { formatShortDatePt } from '../../shared/date';
import { getBmiCategory } from '../../shared/bmi';
import { WeightFormModal } from './WeightFormModal';
import { WeightDayDetailModal } from './WeightDayDetailModal';

const screenWidth = Dimensions.get('window').width;

export function WeightDetailScreen() {
  const navigation = useNavigation<any>();
  const user = useAppStore((s) => s.user);
  const version = useAppStore((s) => s.version);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WeightLog | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco/versao) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await weightRepository.listAll();
      setLogs(all.reverse());
      setError(null);
    } catch {
      setError('Não foi possível carregar seu histórico de peso. Verifique sua conexão e tente de novo.');
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
    }, [load, version])
  );

  const bmi = user?.heightCm && user.currentWeightKg ? user.currentWeightKg / (user.heightCm / 100) ** 2 : null;

  const chartLogs = logs.slice(-10);
  const chartData = {
    labels: chartLogs.map((l) => formatShortDatePt(new Date(l.dateTime)).slice(0, 5)),
    datasets: [{ data: chartLogs.length > 0 ? chartLogs.map((l) => l.weightKg) : [0] }],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenState loading={loading} error={error} onRetry={retry} loadingMessage="Carregando seu histórico...">
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            {chartLogs.length >= 2 ? (
              <LineChart
                data={chartData}
                width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                height={200}
                yAxisSuffix="kg"
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 1,
                  color: () => colors.primary,
                  labelColor: () => colors.textSecondary,
                  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
                }}
                bezier
                style={{ borderRadius: radius.smd }}
              />
            ) : (
              <Text style={typography.small}>Registre ao menos dois pesos para ver o gráfico.</Text>
            )}
          </Card>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={typography.label}>Peso atual</Text>
              <Text style={typography.big}>{user?.currentWeightKg ?? '—'} kg</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={typography.label}>IMC</Text>
              <Text style={typography.big}>{bmi ? bmi.toFixed(1) : '—'}</Text>
            </Card>
          </View>

          {bmi && (
            <Card style={{ marginTop: spacing.md }}>
              <Text style={[styles.bmiCategory, { color: getBmiCategory(bmi).color }]}>{getBmiCategory(bmi).label}</Text>
              <BmiGauge bmi={bmi} />
            </Card>
          )}

          <Button label="+ Registrar novo peso" onPress={() => setFormOpen(true)} style={styles.addButton} />
          <Button
            label="Antes e depois"
            icon="📸"
            variant="secondary"
            onPress={() => navigation.navigate('BeforeAfter')}
            style={styles.beforeAfterButton}
          />

          <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Histórico</Text>
          {logs.length === 0 && (
            <Card>
              <EmptyState
                icon="⚖️"
                title="Nenhum peso registrado ainda"
                description="Toque em “Registrar novo peso” para começar a acompanhar sua evolução."
              />
            </Card>
          )}
          {logs.map((log) => {
            const thumbUri = log.photoFrontUri ?? log.photoSideUri ?? log.photoBackUri;
            return (
              <Pressable
                key={log.id}
                onPress={() => setSelectedLog(log)}
                accessibilityRole="button"
                accessibilityLabel={`${log.weightKg} kg em ${formatShortDatePt(new Date(log.dateTime))}`}
                accessibilityHint="Abre os detalhes do dia"
              >
                <Card style={styles.historyRow}>
                  {thumbUri && <ProgressPhoto photoRef={thumbUri} style={styles.thumb} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyWeight}>{log.weightKg} kg</Text>
                    <Text style={styles.historyDate}>{formatShortDatePt(new Date(log.dateTime))}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScreenState>

      <WeightFormModal visible={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
      <WeightDayDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statCard: { flex: 1 },
  bmiCategory: { fontSize: 15, fontWeight: '700' },
  addButton: { marginTop: spacing.md },
  beforeAfterButton: { marginTop: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  historyWeight: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  historyDate: { ...typography.caption },
});
