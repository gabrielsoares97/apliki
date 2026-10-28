/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { showToast } from '../../shared/toast';
import { View, Text, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { TimeField } from '../../shared/components/TimeField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { WEEKDAY_LABELS_SHORT } from '../../shared/date';
import { Reminder, ReminderType } from '../../types';
import { reminderRepository } from '../../db/repositories';
import { resyncNotifications } from '../../notifications/sync';
import { countPlannedNotifications } from '../../shared/reminderPlan';
import {
  MAX_INTERVAL_MINUTES,
  MAX_TOTAL_REMINDER_NOTIFICATIONS,
  MIN_INTERVAL_MINUTES,
  formatInterval,
  generateIntervalTimes,
} from '../../shared/reminderTimes';

interface ReminderFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingReminder?: Reminder | null;
  type: ReminderType;
  /** Quando definido, esconde o campo "Nome" e usa sempre este valor (ex: lembretes de água). */
  fixedName?: string;
  title?: string;
  /** Habilita o modo "a cada X minutos" (usado nos lembretes de água). */
  allowInterval?: boolean;
}

type Mode = 'fixed' | 'interval';

const INTERVAL_PRESETS = [30, 45, 60, 90, 120, 180];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function ReminderFormModal({ visible, onClose, onSaved, editingReminder, type, fixedName, title, allowInterval }: ReminderFormModalProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00');
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [mode, setMode] = useState<Mode>('fixed');
  const [windowStart, setWindowStart] = useState('08:00');
  const [windowEnd, setWindowEnd] = useState('22:00');
  const [intervalText, setIntervalText] = useState('60');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(editingReminder?.name ?? fixedName ?? '');
      setTime(editingReminder?.times[0] ?? '09:00');
      setDays(editingReminder?.daysOfWeek ?? ALL_DAYS);
      const isInterval = !!allowInterval && !!editingReminder?.intervalMinutes;
      setMode(isInterval ? 'interval' : 'fixed');
      setWindowStart(editingReminder?.windowStart ?? '08:00');
      setWindowEnd(editingReminder?.windowEnd ?? '22:00');
      setIntervalText(String(editingReminder?.intervalMinutes ?? 60));
    }
  }, [visible, editingReminder, fixedName, allowInterval]);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  const intervalMinutes = parseInt(intervalText, 10);
  const intervalValid = Number.isFinite(intervalMinutes) && intervalMinutes >= MIN_INTERVAL_MINUTES && intervalMinutes <= MAX_INTERVAL_MINUTES;
  const intervalTimes = useMemo(
    () => (intervalValid ? generateIntervalTimes(windowStart, windowEnd, intervalMinutes) : []),
    [intervalValid, windowStart, windowEnd, intervalMinutes]
  );

  async function handleSave() {
    if (!name.trim() || days.length === 0 || saving) return;

    let times: string[];
    let intervalFields: Pick<Reminder, 'intervalMinutes' | 'windowStart' | 'windowEnd'>;

    if (mode === 'interval') {
      if (!intervalValid) {
        Alert.alert('Intervalo inválido', `Escolha entre ${MIN_INTERVAL_MINUTES} minutos e ${MAX_INTERVAL_MINUTES / 60} horas.`);
        return;
      }
      if (intervalTimes.length === 0) {
        Alert.alert('Janela inválida', 'O horário final precisa ser depois do inicial.');
        return;
      }
      times = intervalTimes;
      intervalFields = { intervalMinutes, windowStart, windowEnd };
    } else {
      times = [time];
      intervalFields = { intervalMinutes: null, windowStart: null, windowEnd: null };
    }

    setSaving(true);
    try {
      // O limite de notificacoes agendadas do iOS vale para o app inteiro: soma todos os lembretes ativos,
      // com este ja na versao nova (inclusive os avisos avulsos de datas puladas).
      const candidate = editingReminder
        ? { ...editingReminder, times, daysOfWeek: days }
        : { times, daysOfWeek: days, skippedDates: [], active: true };
      const others = (await reminderRepository.listAll()).filter((r) => r.id !== editingReminder?.id);
      const total = countPlannedNotifications([...others, candidate]);
      if (total > MAX_TOTAL_REMINDER_NOTIFICATIONS) {
        const hint =
          mode === 'interval'
            ? 'Aumente o intervalo, reduza a janela, marque todos os dias da semana ou desative outros lembretes.'
            : 'Marque todos os dias da semana ou desative outros lembretes.';
        Alert.alert('Lembretes demais', `Com este lembrete o app teria ${total} notificações agendadas, e o limite é ${MAX_TOTAL_REMINDER_NOTIFICATIONS}. ${hint}`);
        return;
      }

      if (editingReminder) {
        await reminderRepository.update(editingReminder.id, { name: name.trim(), times, daysOfWeek: days, ...intervalFields });
      } else {
        await reminderRepository.insert({
          type,
          name: name.trim(),
          times,
          daysOfWeek: days,
          skippedDates: [],
          active: true,
          ...intervalFields,
        });
      }

      // Reagenda pela conta inteira: respeita os interruptores gerais (ex.: lembretes de água desligados).
      await resyncNotifications();
      onSaved?.();
      showToast('Lembrete salvo ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  const previewText =
    intervalTimes.length === 0
      ? intervalValid
        ? 'O horário final precisa ser depois do inicial.'
        : `Use um intervalo entre ${MIN_INTERVAL_MINUTES} min e ${MAX_INTERVAL_MINUTES / 60} h.`
      : `${intervalTimes.length} lembretes por dia: ${intervalTimes.slice(0, 4).join(', ')}${intervalTimes.length > 4 ? `, … ${intervalTimes[intervalTimes.length - 1]}` : ''}`;

  return (
    <ModalSheet visible={visible} title={title ?? (editingReminder ? 'Editar lembrete' : 'Novo lembrete')} onClose={onClose}>
      {!fixedName && <TextField label="Nome" value={name} onChangeText={setName} placeholder="Ex: Vitamina D" />}

      {allowInterval && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={[typography.label, { marginBottom: spacing.xs }]}>Como quer ser lembrado</Text>
          <View style={styles.chipRow}>
            <Chip label="Em um horário" selected={mode === 'fixed'} onPress={() => setMode('fixed')} />
            <Chip label="A cada X minutos" selected={mode === 'interval'} onPress={() => setMode('interval')} />
          </View>
        </View>
      )}

      {mode === 'fixed' ? (
        <TimeField label="Horário" value={time} onChange={setTime} />
      ) : (
        <View>
          <Text style={[typography.label, { marginBottom: spacing.xs }]}>Me notificar a cada</Text>
          <View style={styles.chipRow}>
            {INTERVAL_PRESETS.map((minutes) => (
              <Chip
                key={minutes}
                label={formatInterval(minutes)}
                selected={intervalMinutes === minutes}
                onPress={() => setIntervalText(String(minutes))}
              />
            ))}
          </View>
          <TextField
            label="Ou digite o intervalo (minutos)"
            keyboardType="number-pad"
            value={intervalText}
            onChangeText={setIntervalText}
            placeholder="Ex: 75"
          />

          <View style={styles.windowRow}>
            <View style={{ flex: 1 }}>
              <TimeField label="A partir das" value={windowStart} onChange={setWindowStart} />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField label="Até as" value={windowEnd} onChange={setWindowEnd} />
            </View>
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{previewText}</Text>
          </View>
        </View>
      )}

      <View style={{ marginBottom: spacing.md }}>
        <Text style={[typography.label, { marginBottom: spacing.xs }]}>Dias da semana</Text>
        <View style={styles.chipRow}>
          {WEEKDAY_LABELS_SHORT.map((label, i) => (
            <Chip key={i} label={label} selected={days.includes(i)} onPress={() => toggleDay(i)} />
          ))}
        </View>
      </View>

      <Button label={editingReminder ? 'Salvar alterações' : 'Criar lembrete'} onPress={handleSave} loading={saving} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  windowRow: { flexDirection: 'row', gap: spacing.sm },
  previewBox: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  previewText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
});
