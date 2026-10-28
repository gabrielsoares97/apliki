/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { createMedication } from '../../db/repositories/medicationRepository';
import { scheduleDoseReminder } from '../../notifications/notifications';
import { computeNextDoseAt, withPreferredTime } from '../../shared/reminderPlan';

export function MedicationSettingsScreen() {
  const medication = useAppStore((s) => s.medication);
  const patchMedication = useAppStore((s) => s.patchMedication);
  const refreshMedication = useAppStore((s) => s.refreshMedication);
  const user = useAppStore((s) => s.user);

  const [name, setName] = useState('');
  const [defaultDoseMg, setDefaultDoseMg] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [preferredReminderTime, setPreferredReminderTime] = useState('08:00');
  const [dosesPerPen, setDosesPerPen] = useState('');

  useEffect(() => {
    if (medication) {
      setName(medication.name);
      setDefaultDoseMg(String(medication.defaultDoseMg));
      setFrequencyDays(String(medication.frequencyDays));
      setPreferredReminderTime(medication.preferredReminderTime);
      setDosesPerPen(medication.dosesPerPen ? String(medication.dosesPerPen) : '');
    }
  }, [medication]);

  async function handleSave() {
    const dose = parseFloat(defaultDoseMg.replace(',', '.')) || 0;
    const freq = parseInt(frequencyDays, 10) || 7;
    const perPen = parseInt(dosesPerPen, 10) || null;

    if (medication) {
      const patch: Partial<typeof medication> = { name, defaultDoseMg: dose, frequencyDays: freq, preferredReminderTime, dosesPerPen: perPen };
      if (perPen !== medication.dosesPerPen) patch.penDosesRemaining = perPen;
      // Mudar o horario preferido move o lembrete da proxima dose para esse horario, no mesmo dia.
      if (preferredReminderTime !== medication.preferredReminderTime) {
        patch.nextDoseAt = withPreferredTime(new Date(medication.nextDoseAt), preferredReminderTime).toISOString();
      }
      await patchMedication(patch);
      await scheduleDoseReminder({ ...medication, ...patch }, user?.notifyDose ?? true);
    } else {
      const nextDoseAt = computeNextDoseAt(new Date(), freq, preferredReminderTime);
      await createMedication({
        name,
        defaultDoseMg: dose,
        frequencyDays: freq,
        preferredReminderTime,
        nextDoseAt: nextDoseAt.toISOString(),
        dosesPerPen: perPen,
        penDosesRemaining: perPen,
      });
      await refreshMedication();
    }
  }

  async function handleNewPen() {
    if (!medication?.dosesPerPen) return;
    await patchMedication({ penDosesRemaining: medication.dosesPerPen });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Configure o nome, dosagem padrão e frequência de aplicação.
        </Text>

        <TextField label="Nome do medicamento" value={name} onChangeText={setName} placeholder="Ex: Tirzepatida 5mg" />
        <TextField label="Dosagem padrão (mg)" keyboardType="decimal-pad" value={defaultDoseMg} onChangeText={setDefaultDoseMg} />
        <TextField label="Frequência (dias)" keyboardType="number-pad" value={frequencyDays} onChangeText={setFrequencyDays} />
        <TextField
          label="Horário preferido do lembrete (HH:mm)"
          value={preferredReminderTime}
          onChangeText={setPreferredReminderTime}
          placeholder="08:00"
        />
        <TextField
          label="Doses por caneta (opcional)"
          keyboardType="number-pad"
          value={dosesPerPen}
          onChangeText={setDosesPerPen}
          placeholder="Ex: 4"
        />
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.md }]}>
          Usado para te avisar quando a caneta atual estiver acabando.
        </Text>

        {medication && (
          <View style={{ marginTop: spacing.sm }}>
            <DateTimeField
              label="Próxima dose agendada"
              value={new Date(medication.nextDoseAt)}
              onChange={(date) => patchMedication({ nextDoseAt: date.toISOString() })}
            />
          </View>
        )}

        {medication?.dosesPerPen && (
          <View style={styles.penRow}>
            <Text style={typography.body}>Doses restantes na caneta atual: {medication.penDosesRemaining ?? medication.dosesPerPen}</Text>
            <Button label="Troquei de caneta" variant="secondary" onPress={handleNewPen} />
          </View>
        )}

        <Button label="Salvar medicamento" onPress={handleSave} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  penRow: { marginTop: spacing.md, gap: spacing.sm },
});
