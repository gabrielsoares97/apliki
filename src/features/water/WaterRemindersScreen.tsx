/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { showToast } from '../../shared/toast';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { ScreenState } from '../../shared/components/ScreenState';
import { BrandSwitch, ToggleRow } from '../../shared/components/ToggleRow';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { reminderRepository } from '../../db/repositories';
import { Reminder } from '../../types';
import { WEEKDAY_LABELS_SHORT, toDateKey, addDays } from '../../shared/date';
import { formatInterval } from '../../shared/reminderTimes';
import { ReminderFormModal } from '../dose/ReminderFormModal';
import { cancelReminderNotifications, scheduleReminderNotifications, ensureNotificationPermission } from '../../notifications/notifications';
import { useAppStore } from '../../store/useAppStore';

const WATER_REMINDER_NAME = 'Beber água';

export function WaterRemindersScreen() {
  const user = useAppStore((s) => s.user);
  const patchUser = useAppStore((s) => s.patchUser);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco/salvar) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setReminders(await reminderRepository.listByType('water'));
      setError(null);
    } catch {
      setError('Não foi possível carregar seus lembretes de água. Verifique sua conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleToggleMaster(next: boolean) {
    if (!user) return;
    if (next) await ensureNotificationPermission();
    await patchUser({ notifyWater: next });
    // Liga/desliga todos os horários de água de uma vez, sem apagar a configuração de cada um.
    await Promise.all(
      reminders
        .filter((r) => r.active)
        .map((r) => (next ? scheduleReminderNotifications(r) : cancelReminderNotifications(r.id)))
    );
  }

  async function handleToggleActive(reminder: Reminder) {
    const active = !reminder.active;
    await reminderRepository.update(reminder.id, { active });
    if (active && user?.notifyWater) await scheduleReminderNotifications({ ...reminder, active });
    else await cancelReminderNotifications(reminder.id);
    load();
  }

  async function handleSkipNext(reminder: Reminder) {
    const tomorrowKey = toDateKey(addDays(new Date(), 1));
    const skippedDates = [...new Set([...(reminder.skippedDates ?? []), tomorrowKey])];
    await reminderRepository.update(reminder.id, { skippedDates });
    if (reminder.active && user?.notifyWater) await scheduleReminderNotifications({ ...reminder, skippedDates });
    load();
    showToast('Lembretes de amanhã pulados');
  }

  async function handleDelete(reminder: Reminder) {
    await cancelReminderNotifications(reminder.id);
    await reminderRepository.remove(reminder.id);
    load();
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenState loading={loading} error={error} onRetry={retry} loadingMessage="Carregando seus lembretes...">
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Escolha em quais horários o apliKI deve te lembrar de beber água.
          </Text>

          <Card style={{ marginBottom: spacing.md }}>
            <ToggleRow label="Ativar lembretes de água" value={user.notifyWater} onValueChange={handleToggleMaster} />
          </Card>

          {reminders.length === 0 && (
            <Card style={{ marginBottom: spacing.md }}>
              <EmptyState
                icon="💧"
                title="Nenhum horário configurado ainda"
                description="Toque em “Novo lembrete” para escolher horários fixos ou um intervalo ao longo do dia."
              />
            </Card>
          )}

          {reminders.map((reminder) => (
            <Card key={reminder.id} style={{ marginBottom: spacing.sm, opacity: user.notifyWater ? 1 : 0.5 }}>
              <View style={styles.row}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => { setEditing(reminder); setFormOpen(true); }}
                  disabled={!user.notifyWater}
                  accessibilityRole="button"
                  accessibilityHint="Abre o lembrete para editar"
                  accessibilityState={{ disabled: !user.notifyWater }}
                >
                  {reminder.intervalMinutes ? (
                    <>
                      <Text style={styles.timeText}>A cada {formatInterval(reminder.intervalMinutes)}</Text>
                      <Text style={styles.intervalDetail}>
                        Das {reminder.windowStart} às {reminder.windowEnd} · {reminder.times.length} lembretes por dia
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.timeText}>{reminder.times.join(', ')}</Text>
                  )}
                  <View style={styles.daysRow}>
                    {WEEKDAY_LABELS_SHORT.map((label, i) => (
                      <Text key={i} style={[styles.dayBadge, reminder.daysOfWeek.includes(i) && styles.dayBadgeActive]}>
                        {label}
                      </Text>
                    ))}
                  </View>
                </Pressable>
                <BrandSwitch
                  value={reminder.active}
                  onValueChange={() => handleToggleActive(reminder)}
                  disabled={!user.notifyWater}
                  accessibilityLabel="Lembrete ativo"
                />
              </View>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => handleSkipNext(reminder)} hitSlop={12} accessibilityRole="button">
                  <Text style={styles.actionLink}>Pular amanhã</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(reminder)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Excluir lembrete">
                  <Text style={[styles.actionLink, { color: colors.danger }]}>Excluir</Text>
                </Pressable>
              </View>
            </Card>
          ))}

          {/* Botao azul (cor da agua) com texto branco: mantido como estava, identidade visual da secao de agua. */}
          <Pressable style={styles.addButton} onPress={openNew} accessibilityRole="button">
            <Text style={styles.addButtonText}>+ Novo lembrete</Text>
          </Pressable>
        </ScrollView>
      </ScreenState>

      <ReminderFormModal
        visible={formOpen}
        type="water"
        title={editing ? 'Editar lembrete' : 'Novo lembrete de água'}
        fixedName={WATER_REMINDER_NAME}
        allowInterval
        editingReminder={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  intervalDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  dayBadge: { fontSize: 11, color: colors.textSecondary, width: 18, textAlign: 'center' },
  dayBadgeActive: { color: colors.water, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  actionLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  addButton: { backgroundColor: colors.water, borderRadius: radius.smd, minHeight: 44, justifyContent: 'center', paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.md },
  addButtonText: { color: colors.white, fontWeight: '700' },
});
