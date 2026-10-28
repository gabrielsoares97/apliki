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
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ScreenState } from '../../shared/components/ScreenState';
import { BrandSwitch } from '../../shared/components/ToggleRow';
import { colors, spacing, typography } from '../../shared/theme';
import { reminderRepository } from '../../db/repositories';
import { Reminder } from '../../types';
import { WEEKDAY_LABELS_SHORT, toDateKey, addDays } from '../../shared/date';
import { ReminderFormModal } from './ReminderFormModal';
import { cancelReminderNotifications, scheduleReminderNotifications } from '../../notifications/notifications';

export function SupplementRemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco/salvar) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await reminderRepository.listAll();
      setReminders(all.filter((r) => r.type === 'supplement' || r.type === 'med'));
      setError(null);
    } catch {
      setError('Não foi possível carregar seus lembretes. Verifique sua conexão e tente de novo.');
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

  async function handleToggleActive(reminder: Reminder) {
    const active = !reminder.active;
    await reminderRepository.update(reminder.id, { active });
    if (active) await scheduleReminderNotifications({ ...reminder, active });
    else await cancelReminderNotifications(reminder.id);
    load();
  }

  async function handleSkipNext(reminder: Reminder) {
    const tomorrowKey = toDateKey(addDays(new Date(), 1));
    const skippedDates = [...new Set([...(reminder.skippedDates ?? []), tomorrowKey])];
    await reminderRepository.update(reminder.id, { skippedDates });
    if (reminder.active) await scheduleReminderNotifications({ ...reminder, skippedDates });
    load();
    showToast('Lembrete de amanhã pulado');
  }

  async function handleDelete(reminder: Reminder) {
    await cancelReminderNotifications(reminder.id);
    await reminderRepository.remove(reminder.id);
    load();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenState loading={loading} error={error} onRetry={retry} loadingMessage="Carregando seus lembretes...">
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Suplementos e outros remédios que não são o medicamento principal.
          </Text>

          {reminders.length === 0 && (
            <Card>
              <EmptyState
                icon="💊"
                title="Nenhum lembrete criado ainda"
                description="Crie um lembrete para ser avisado na hora de tomar seus suplementos ou remédios."
                actionLabel="Criar lembrete"
                onAction={openNew}
              />
            </Card>
          )}

          {reminders.map((reminder) => (
            <Card key={reminder.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => { setEditing(reminder); setFormOpen(true); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${reminder.name}, ${reminder.times.join(', ')}`}
                  accessibilityHint="Abre o lembrete para editar"
                >
                  <Text style={typography.subtitle}>{reminder.name}</Text>
                  <Text style={styles.detail}>{reminder.times.join(', ')}</Text>
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
                  accessibilityLabel={`Lembrete ${reminder.name} ativo`}
                />
              </View>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => handleSkipNext(reminder)} hitSlop={12} accessibilityRole="button">
                  <Text style={styles.actionLink}>Pular amanhã</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(reminder)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir lembrete ${reminder.name}`}
                >
                  <Text style={[styles.actionLink, { color: colors.danger }]}>Excluir</Text>
                </Pressable>
              </View>
            </Card>
          ))}

          {reminders.length > 0 && <Button label="+ Novo lembrete" onPress={openNew} style={styles.addButton} />}
        </ScrollView>
      </ScreenState>

      <ReminderFormModal
        visible={formOpen}
        type="supplement"
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
  detail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  dayBadge: { fontSize: 11, color: colors.textSecondary, width: 18, textAlign: 'center' },
  dayBadgeActive: { color: colors.primary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  actionLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  addButton: { marginTop: spacing.md },
});
