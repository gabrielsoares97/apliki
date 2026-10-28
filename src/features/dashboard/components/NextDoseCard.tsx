/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { DateTimePickerFlow } from '../../../shared/components/DateTimeField';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import { CardLink } from '../../../shared/components/CardParts';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { formatDateTimePt, getCountdown } from '../../../shared/date';
import { Medication, DoseLog } from '../../../types';

interface NextDoseCardProps {
  medication: Medication;
  lastDose: DoseLog | null;
  onRegisterDose: () => void;
  onChangeDate: (date: Date) => void;
  onPress: () => void;
}

export function NextDoseCard({ medication, lastDose, onRegisterDose, onChangeDate, onPress }: NextDoseCardProps) {
  const [now, setNow] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const nextDoseDate = new Date(medication.nextDoseAt);
  const countdown = getCountdown(nextDoseDate, now);

  const cycleStartMs = lastDose ? new Date(lastDose.dateTime).getTime() : nextDoseDate.getTime() - medication.frequencyDays * 86400000;
  const totalMs = Math.max(1, nextDoseDate.getTime() - cycleStartMs);
  const elapsedMs = now.getTime() - cycleStartMs;
  const cycleProgress = Math.max(0, Math.min(1, elapsedMs / totalMs));

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle}>Próxima aplicação</Text>
        <Text style={styles.medName}>{medication.name}</Text>
      </View>

      {countdown.isPast ? (
        <Text style={styles.overdue}>Dose atrasada — registre assim que possível</Text>
      ) : (
        <View style={styles.countdownRow}>
          <CountdownUnit value={countdown.days} label="dias" />
          <CountdownUnit value={countdown.hours} label="horas" />
          <CountdownUnit value={countdown.minutes} label="min" />
        </View>
      )}

      <ProgressBar progress={cycleProgress} style={{ marginTop: spacing.sm }} />

      <Text style={styles.detailText}>Próxima dose: {formatDateTimePt(nextDoseDate)}</Text>
      {lastDose && <Text style={styles.detailText}>Última dose: {lastDose.doseMg}mg em {formatDateTimePt(new Date(lastDose.dateTime))}</Text>}
      {medication.penDosesRemaining !== null && medication.penDosesRemaining !== undefined && medication.penDosesRemaining <= 1 && (
        <Text style={styles.penWarning}>⚠️ Caneta acabando — última dose disponível.</Text>
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryAction} onPress={() => setShowPicker(true)} accessibilityRole="button">
          <Text style={styles.secondaryActionText}>Alterar data</Text>
        </Pressable>
        <Pressable style={styles.primaryAction} onPress={onRegisterDose} accessibilityRole="button">
          <Text style={styles.primaryActionText}>Registrar dose agora</Text>
        </Pressable>
      </View>

      <CardLink label="Ver histórico de doses" />

      <DateTimePickerFlow visible={showPicker} value={nextDoseDate} onConfirm={onChangeDate} onClose={() => setShowPicker(false)} />
    </Card>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.unitValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginBottom: spacing.sm },
  medName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  countdownRow: { flexDirection: 'row', gap: spacing.lg, marginVertical: spacing.xs },
  unit: { alignItems: 'center' },
  unitValue: { fontSize: 30, fontWeight: '700', color: colors.primary },
  unitLabel: { fontSize: 12, color: colors.textSecondary },
  overdue: { color: colors.danger, fontWeight: '600', marginVertical: spacing.sm },
  detailText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
  penWarning: { fontSize: 13, color: colors.warningText, fontWeight: '600', marginTop: spacing.xs },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryAction: { flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.smd, alignItems: 'center', backgroundColor: colors.primaryLight },
  secondaryActionText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  primaryAction: { flex: 1.4, minHeight: 44, justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.smd, alignItems: 'center', backgroundColor: colors.primary },
  primaryActionText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
});
