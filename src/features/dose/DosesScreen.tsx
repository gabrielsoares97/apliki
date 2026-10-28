/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState, LoadingState } from '../../shared/components/ScreenState';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { doseRepository } from '../../db/repositories';
import { useAppStore } from '../../store/useAppStore';
import { DoseLog } from '../../types';
import { formatShortDatePt, formatTimePt } from '../../shared/date';
import { APPLICATION_SITE_LABELS } from '../../shared/labels';
import { DoseFormModal } from './DoseFormModal';

const screenWidth = Dimensions.get('window').width;

export function DosesScreen() {
  const navigation = useNavigation<any>();
  const medication = useAppStore((s) => s.medication);
  const version = useAppStore((s) => s.version);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  // Carregando so ate a primeira resposta; recargas (foco/versao) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDoses(await doseRepository.listAll());
      setError(null);
    } catch {
      setError('Não foi possível carregar suas doses. Verifique sua conexão e tente de novo.');
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

  const chartDoses = doses.slice(0, 8).reverse();
  const chartData = {
    labels: chartDoses.map((d) => formatShortDatePt(new Date(d.dateTime)).slice(0, 5)),
    datasets: [{ data: chartDoses.length > 0 ? chartDoses.map((d) => d.doseMg) : [0] }],
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={typography.title}>Doses</Text>
          <Pressable onPress={() => navigation.navigate('MedicationSettings')} hitSlop={12} accessibilityRole="button">
            <Text style={styles.link}>Medicamento</Text>
          </Pressable>
        </View>

        {loading ? (
          <LoadingState message="Carregando suas doses..." fullScreen={false} style={styles.state} />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} fullScreen={false} style={styles.state} />
        ) : (
          <>
            {medication && (
              <Card style={{ marginTop: spacing.sm }}>
                <Text style={typography.subtitle}>{medication.name}</Text>
                <Text style={styles.detail}>Dose padrão: {medication.defaultDoseMg}mg · a cada {medication.frequencyDays} dias</Text>
              </Card>
            )}

            <Card style={{ marginTop: spacing.md }}>
              <Text style={typography.subtitle}>Dosagem ao longo do tempo</Text>
              {chartDoses.length >= 2 ? (
                <BarChart
                  data={chartData}
                  width={screenWidth - spacing.lg * 2 - spacing.md * 2}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix="mg"
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 1,
                    color: () => colors.primary,
                    labelColor: () => colors.textSecondary,
                  }}
                  style={{ borderRadius: radius.smd, marginTop: spacing.sm }}
                  fromZero
                />
              ) : (
                <Text style={styles.chartHint}>Registre mais doses para ver o gráfico.</Text>
              )}
            </Card>

            <Button label="+ Registrar dose" onPress={() => setFormOpen(true)} style={styles.addButton} />

            <Pressable style={styles.reminderLinkRow} onPress={() => navigation.navigate('SupplementReminders')} accessibilityRole="button">
              <Text style={styles.link}>Lembretes de suplementos e outros remédios →</Text>
            </Pressable>

            <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Histórico</Text>
            {doses.length === 0 && (
              <Card>
                <EmptyState
                  icon="💉"
                  title="Nenhuma dose registrada ainda"
                  description="Toque em “Registrar dose” após a aplicação para acompanhar o histórico e a próxima dose."
                />
              </Card>
            )}
            {doses.map((dose) => (
              <Card key={dose.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.doseRow}>
                  <Text style={styles.doseValue}>{dose.doseMg}mg</Text>
                  <Text style={styles.doseDate}>
                    {formatShortDatePt(new Date(dose.dateTime))} · {formatTimePt(new Date(dose.dateTime))}
                  </Text>
                </View>
                {dose.applicationSite && <Text style={styles.detail}>Local: {APPLICATION_SITE_LABELS[dose.applicationSite]}</Text>}
                {dose.notes && <Text style={styles.detail}>{dose.notes}</Text>}
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <DoseFormModal visible={formOpen} onClose={() => setFormOpen(false)} onSaved={load} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  detail: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  addButton: { marginTop: spacing.md },
  chartHint: { ...typography.small, marginTop: spacing.xs },
  state: { paddingVertical: spacing.xl },
  reminderLinkRow: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: spacing.sm },
  doseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  doseValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  doseDate: { fontSize: 13, color: colors.textSecondary },
});
