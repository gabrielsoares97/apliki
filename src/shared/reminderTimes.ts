/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export const MIN_INTERVAL_MINUTES = 30;
export const MAX_INTERVAL_MINUTES = 480;
/** iOS guarda no maximo 64 notificacoes agendadas por app; mantemos folga para os outros lembretes. */
export const MAX_NOTIFICATIONS_PER_REMINDER = 40;
/**
 * Teto para a soma de todos os lembretes: as 64 do iOS menos a dose (2), as refeicoes e a atividade
 * automaticas (4) e uma folga para o "Depois (30 min)" e a pausa do treino (2).
 */
export const MAX_TOTAL_REMINDER_NOTIFICATIONS = 56;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Gera os horarios "HH:mm" de start ate end (inclusive) a cada intervalMinutes. Vazio se os dados forem invalidos. */
export function generateIntervalTimes(start: string, end: string, intervalMinutes: number): string[] {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes < MIN_INTERVAL_MINUTES) return [];
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (Number.isNaN(startMin) || Number.isNaN(endMin) || endMin < startMin) return [];

  const times: string[] = [];
  for (let t = startMin; t <= endMin; t += intervalMinutes) times.push(toTime(t));
  return times;
}

/** Quantas notificacoes agendadas o lembrete gera: uma por horario se todos os dias, senao uma por horario e dia. */
export function countScheduledNotifications(timesCount: number, daysCount: number): number {
  return daysCount >= 7 ? timesCount : timesCount * daysCount;
}

export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}
