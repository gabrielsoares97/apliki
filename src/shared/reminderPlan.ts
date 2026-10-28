/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Medication, Reminder } from '../types';
import { addDays, startOfDay, toDateKey } from './date';
import { MAX_NOTIFICATIONS_PER_REMINDER } from './reminderTimes';

/**
 * Decide quais notificacoes agendar para um lembrete, sem tocar no modulo nativo (facil de testar).
 * `key` identifica cada agendamento dentro do lembrete e vira parte do identificador da notificacao.
 */

export type PlannedTrigger =
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number } // weekday: 0=domingo ... 6=sabado
  | { kind: 'date'; date: Date };

export interface PlannedNotification {
  key: string;
  trigger: PlannedTrigger;
}

/** Semanas cobertas por avisos avulsos no dia da semana que teve uma ocorrencia pulada. */
const SKIP_FOLLOW_UP_WEEKS = 2;

/**
 * Limite do plano "exato" com data pulada (repeticoes semanais + avisos avulsos), que custa ~8 agendamentos
 * por horario. Acima disso (ex.: agua "a cada 30 min") usamos a ponte curta, que nao multiplica os avisos.
 */
const SKIP_EXACT_PLAN_BUDGET = 16;

type ParsedTime = { time: string; hour: number; minute: number };

function parseTime(time: string): { hour: number; minute: number } | null {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function parseDateKey(key: string): Date | null {
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Datas puladas que ainda vao acontecer (hoje ate daqui a 6 dias), indexadas pelo dia da semana. */
function pendingSkips(skippedDates: string[], days: number[], now: Date): Map<number, Date> {
  const today = startOfDay(now).getTime();
  const limit = addDays(startOfDay(now), 6).getTime();
  const skips = new Map<number, Date>();
  for (const key of skippedDates) {
    const date = parseDateKey(key);
    if (!date) continue;
    const time = date.getTime();
    if (time < today || time > limit || !days.includes(date.getDay())) continue;
    skips.set(date.getDay(), date);
  }
  return skips;
}

/** Sem nada pulado: um agendamento diario por horario (todos os dias) ou um semanal por horario e dia. */
function recurringPlan(times: ParsedTime[], days: number[]): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (const { time, hour, minute } of times) {
    if (days.length >= 7) {
      plan.push({ key: `all-${time}`, trigger: { kind: 'daily', hour, minute } });
      continue;
    }
    for (const weekday of days) plan.push({ key: `${weekday}-${time}`, trigger: { kind: 'weekly', weekday, hour, minute } });
  }
  return plan;
}

/**
 * Plano exato com data pulada: repeticao semanal nos outros dias e, no dia da semana pulado, avisos avulsos
 * nas semanas seguintes (uma repeticao semanal nao consegue "pular so a proxima"). A repeticao normal volta
 * quando o app reagenda depois da data pulada. Continua valendo mesmo se o app ficar dias sem ser aberto.
 */
function exactSkipPlan(times: ParsedTime[], days: number[], skips: Map<number, Date>): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (const { time, hour, minute } of times) {
    for (const weekday of days) {
      const skipped = skips.get(weekday);
      if (!skipped) {
        plan.push({ key: `${weekday}-${time}`, trigger: { kind: 'weekly', weekday, hour, minute } });
        continue;
      }
      for (let week = 1; week <= SKIP_FOLLOW_UP_WEEKS; week++) {
        const date = addDays(skipped, 7 * week);
        date.setHours(hour, minute, 0, 0);
        plan.push({ key: `${weekday}-${time}-w${week}`, trigger: { kind: 'date', date } });
      }
    }
  }
  return plan;
}

/**
 * Ponte curta para lembretes com muitos horarios: so avisos avulsos de agora ate o fim do primeiro dia
 * ativo depois da data pulada (o dia pulado fica sem aviso). Custa no maximo ~2 dias de horarios em vez de
 * 8 semanas de repeticoes; a repeticao diaria/semanal volta no proximo reagendamento (abertura do app).
 * Limitada a MAX_NOTIFICATIONS_PER_REMINDER, mantendo os mais proximos (o iOS tambem descarta os mais distantes).
 */
function bridgeSkipPlan(times: ParsedTime[], days: number[], skips: Map<number, Date>, now: Date): PlannedNotification[] {
  const skippedKeys = new Set([...skips.values()].map(toDateKey));
  const lastSkip = Math.max(...[...skips.values()].map((d) => d.getTime()));
  const plan: PlannedNotification[] = [];

  for (let offset = 0; offset <= 13; offset++) {
    const day = addDays(startOfDay(now), offset);
    const dayKey = toDateKey(day);
    if (!days.includes(day.getDay()) || skippedKeys.has(dayKey)) continue;
    for (const { time, hour, minute } of times) {
      const date = new Date(day);
      date.setHours(hour, minute, 0, 0);
      if (date.getTime() > now.getTime()) plan.push({ key: `once-${dayKey}-${time}`, trigger: { kind: 'date', date } });
    }
    // Primeiro dia ativo depois da ultima data pulada: a ponte termina aqui.
    if (day.getTime() > lastSkip) break;
  }

  const limit = Math.max(times.length, MAX_NOTIFICATIONS_PER_REMINDER);
  return plan.slice(0, limit);
}

export function planReminder(
  reminder: Pick<Reminder, 'times' | 'daysOfWeek' | 'skippedDates' | 'active'>,
  now: Date = new Date()
): PlannedNotification[] {
  if (!reminder.active) return [];

  const days = [...new Set(reminder.daysOfWeek)].filter((d) => d >= 0 && d <= 6);
  const times: ParsedTime[] = [];
  for (const time of reminder.times) {
    const parsed = parseTime(time);
    if (parsed) times.push({ time, ...parsed });
  }
  if (days.length === 0 || times.length === 0) return [];

  const skips = pendingSkips(reminder.skippedDates ?? [], days, now);
  // Todos os dias e nada pulado: um unico agendamento diario por horario (os lembretes "a cada X min"
  // geram muitos horarios e estourariam o limite de notificacoes agendadas do iOS).
  if (skips.size === 0) return recurringPlan(times, days);

  const exact = exactSkipPlan(times, days, skips);
  return exact.length <= SKIP_EXACT_PLAN_BUDGET ? exact : bridgeSkipPlan(times, days, skips, now);
}

/** Total de notificacoes agendadas pelos lembretes (repeticoes contam uma vez, como no limite do iOS). */
export function countPlannedNotifications(
  reminders: Pick<Reminder, 'times' | 'daysOfWeek' | 'skippedDates' | 'active'>[],
  now: Date = new Date()
): number {
  return reminders.reduce((sum, reminder) => sum + planReminder(reminder, now).length, 0);
}

/** Proxima dose: `frequencyDays` depois da aplicacao, no horario preferido do lembrete. */
export function computeNextDoseAt(appliedAt: Date, frequencyDays: number, preferredTime: string | null | undefined): Date {
  return withPreferredTime(addDays(appliedAt, frequencyDays), preferredTime);
}

/** Mesma data, no horario preferido ("HH:mm"). Horario invalido mantem a data como esta. */
export function withPreferredTime(date: Date, preferredTime: string | null | undefined): Date {
  const parsed = preferredTime ? parseTime(preferredTime) : null;
  const result = new Date(date);
  if (parsed) result.setHours(parsed.hour, parsed.minute, 0, 0);
  return result;
}

/**
 * O que muda no medicamento depois de uma alteracao no historico de doses: a proxima dose sai da dose mais
 * recente (por data) e a caneta ganha/perde `penDelta` doses, entre 0 e o total da caneta.
 * Sem nenhuma dose a proxima data fica como esta (foi escolhida pela pessoa no cadastro).
 */
export function medicationPatchFromLatestDose(
  medication: Pick<Medication, 'frequencyDays' | 'preferredReminderTime' | 'penDosesRemaining' | 'dosesPerPen'>,
  latestDose: { dateTime: string } | null,
  penDelta: number = 0
): Partial<Pick<Medication, 'nextDoseAt' | 'penDosesRemaining'>> {
  const patch: Partial<Pick<Medication, 'nextDoseAt' | 'penDosesRemaining'>> = {};
  const appliedAt = latestDose ? new Date(latestDose.dateTime) : null;
  if (appliedAt && !Number.isNaN(appliedAt.getTime())) {
    patch.nextDoseAt = computeNextDoseAt(appliedAt, medication.frequencyDays, medication.preferredReminderTime).toISOString();
  }
  if (penDelta !== 0 && medication.penDosesRemaining !== null && medication.penDosesRemaining !== undefined) {
    const max = medication.dosesPerPen ?? Number.POSITIVE_INFINITY;
    patch.penDosesRemaining = Math.max(0, Math.min(max, medication.penDosesRemaining + penDelta));
  }
  return patch;
}
