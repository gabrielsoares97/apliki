/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Dia no fuso do aparelho, "YYYY-MM-DD". Nao usar toISOString: ele converte para UTC e muda o dia perto da meia-noite. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Dia local de um registro salvo em ISO (UTC), ex.: `entry.dateTime`. */
export function dateKeyOfIso(iso: string): string {
  return toDateKey(new Date(iso));
}

/** Dias de calendario de `a` ate `b`, contando viradas de dia no fuso local (e nao blocos de 24h, que erram no horario de verao). */
export function calendarDaysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function formatDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function formatShortDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTimePt(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTimePt(date: Date): string {
  return `${formatShortDatePt(date)} ${formatTimePt(date)}`;
}

export interface Countdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function getCountdown(target: Date, from: Date = new Date()): Countdown {
  const totalMs = target.getTime() - from.getTime();
  const isPast = totalMs <= 0;
  const abs = Math.abs(totalMs);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((abs / (1000 * 60)) % 60);
  const seconds = Math.floor((abs / 1000) % 60);
  return { totalMs, days, hours, minutes, seconds, isPast };
}

export const WEEKDAY_LABELS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export const WEEKDAY_LABELS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
