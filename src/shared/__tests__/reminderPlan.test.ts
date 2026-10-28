/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { computeNextDoseAt, countPlannedNotifications, medicationPatchFromLatestDose, planReminder, withPreferredTime } from '../reminderPlan';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
// Quarta-feira, 7 de outubro de 2026, 10:00 (horario local).
const NOW = new Date(2026, 9, 7, 10, 0);

describe('planReminder', () => {
  it('nao agenda nada para lembrete inativo', () => {
    expect(planReminder({ times: ['09:00'], daysOfWeek: ALL_DAYS, skippedDates: [], active: false }, NOW)).toEqual([]);
  });

  it('usa um agendamento diario por horario quando vale para todos os dias', () => {
    const plan = planReminder({ times: ['09:00', '14:30'], daysOfWeek: ALL_DAYS, skippedDates: [], active: true }, NOW);
    expect(plan).toEqual([
      { key: 'all-09:00', trigger: { kind: 'daily', hour: 9, minute: 0 } },
      { key: 'all-14:30', trigger: { kind: 'daily', hour: 14, minute: 30 } },
    ]);
  });

  it('usa agendamentos semanais quando so alguns dias estao marcados', () => {
    const plan = planReminder({ times: ['09:00'], daysOfWeek: [1, 3], skippedDates: [], active: true }, NOW);
    expect(plan).toEqual([
      { key: '1-09:00', trigger: { kind: 'weekly', weekday: 1, hour: 9, minute: 0 } },
      { key: '3-09:00', trigger: { kind: 'weekly', weekday: 3, hour: 9, minute: 0 } },
    ]);
  });

  it('pula a data marcada e mantem os outros dias', () => {
    // Amanha (quinta, 8/10) foi pulado.
    const plan = planReminder({ times: ['09:00'], daysOfWeek: ALL_DAYS, skippedDates: ['2026-10-08'], active: true }, NOW);
    const weekly = plan.filter((p) => p.trigger.kind === 'weekly').map((p) => (p.trigger as { weekday: number }).weekday);
    expect(weekly).toEqual([0, 1, 2, 3, 5, 6]);

    const dates = plan.filter((p) => p.trigger.kind === 'date').map((p) => (p.trigger as { date: Date }).date);
    expect(dates).toEqual([new Date(2026, 9, 15, 9, 0), new Date(2026, 9, 22, 9, 0)]);
  });

  it('nao multiplica os avisos ao pular amanha num lembrete "a cada X min"', () => {
    // 08:00 ate 22:00 a cada 30 min = 29 horarios por dia (antes: 6 x 29 semanais + 2 x 29 avulsos = 232).
    const times = Array.from({ length: 29 }, (_, i) => {
      const minutes = 8 * 60 + i * 30;
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    });
    const plan = planReminder({ times, daysOfWeek: ALL_DAYS, skippedDates: ['2026-10-08'], active: true }, NOW);

    expect(plan.length).toBeLessThanOrEqual(40);
    expect(plan.every((p) => p.trigger.kind === 'date')).toBe(true);
    const dates = plan.map((p) => (p.trigger as { date: Date }).date);
    // Nada no dia pulado, nada que ja passou, e ordem cronologica (o iOS descarta os mais distantes).
    expect(dates.some((d) => d.getDate() === 8)).toBe(false);
    expect(dates.every((d) => d.getTime() > NOW.getTime())).toBe(true);
    expect(dates.map((d) => d.getTime())).toEqual([...dates].map((d) => d.getTime()).sort((a, b) => a - b));
    // Hoje (7/10) a partir das 10:30 e depois o dia seguinte ao pulado (9/10).
    expect(dates[0]).toEqual(new Date(2026, 9, 7, 10, 30));
    expect(dates.some((d) => d.getDate() === 9)).toBe(true);
    // Chaves unicas (viram identificadores das notificacoes).
    expect(new Set(plan.map((p) => p.key)).size).toBe(plan.length);
  });

  it('ponte curta: pular hoje cobre so o dia seguinte', () => {
    const times = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    const plan = planReminder({ times, daysOfWeek: ALL_DAYS, skippedDates: ['2026-10-07'], active: true }, NOW);
    const days = new Set(plan.map((p) => (p.trigger as { date: Date }).date.getDate()));
    expect([...days]).toEqual([8]);
    expect(plan).toHaveLength(7);
  });

  it('ponte curta respeita os dias da semana marcados', () => {
    // Segunda (1) e sexta (5); pulada a sexta 9/10. Proximo dia ativo depois dela: segunda 12/10.
    const times = Array.from({ length: 10 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`);
    const plan = planReminder({ times, daysOfWeek: [1, 5], skippedDates: ['2026-10-09'], active: true }, NOW);
    const days = new Set(plan.map((p) => (p.trigger as { date: Date }).date.getDate()));
    expect([...days]).toEqual([12]);
  });

  it('ignora datas puladas que ja passaram', () => {
    const plan = planReminder({ times: ['09:00'], daysOfWeek: ALL_DAYS, skippedDates: ['2026-10-01'], active: true }, NOW);
    expect(plan).toEqual([{ key: 'all-09:00', trigger: { kind: 'daily', hour: 9, minute: 0 } }]);
  });

  it('ignora horarios invalidos', () => {
    expect(planReminder({ times: ['25:00', 'abc'], daysOfWeek: ALL_DAYS, skippedDates: [], active: true }, NOW)).toEqual([]);
  });
});

describe('proxima dose', () => {
  it('cai no horario preferido, N dias depois da aplicacao', () => {
    expect(computeNextDoseAt(new Date(2026, 9, 7, 20, 15), 7, '08:00')).toEqual(new Date(2026, 9, 14, 8, 0));
  });

  it('mantem o horario quando o preferido e invalido', () => {
    const date = new Date(2026, 9, 7, 20, 15);
    expect(withPreferredTime(date, '')).toEqual(date);
    expect(withPreferredTime(date, 'oi')).toEqual(date);
  });
});

describe('countPlannedNotifications', () => {
  it('soma os agendamentos de todos os lembretes ativos', () => {
    const reminders = [
      { times: ['09:00', '14:30'], daysOfWeek: ALL_DAYS, skippedDates: [], active: true }, // 2 diarios
      { times: ['09:00'], daysOfWeek: [1, 3, 5], skippedDates: [], active: true }, // 3 semanais
      { times: ['20:00'], daysOfWeek: ALL_DAYS, skippedDates: [], active: false }, // inativo
    ];
    expect(countPlannedNotifications(reminders, NOW)).toBe(5);
  });
});

describe('medicationPatchFromLatestDose', () => {
  const medication = { frequencyDays: 7, preferredReminderTime: '08:00', penDosesRemaining: 2, dosesPerPen: 4 };

  it('calcula a proxima dose a partir da dose mais recente', () => {
    const patch = medicationPatchFromLatestDose(medication, { dateTime: new Date(2026, 9, 7, 20, 15).toISOString() });
    expect(patch.nextDoseAt).toBe(new Date(2026, 9, 14, 8, 0).toISOString());
    expect(patch.penDosesRemaining).toBeUndefined();
  });

  it('sem doses mantem a proxima data escolhida', () => {
    expect(medicationPatchFromLatestDose(medication, null)).toEqual({});
  });

  it('desconta e devolve doses da caneta sem passar dos limites', () => {
    expect(medicationPatchFromLatestDose(medication, null, -1).penDosesRemaining).toBe(1);
    expect(medicationPatchFromLatestDose({ ...medication, penDosesRemaining: 0 }, null, -1).penDosesRemaining).toBe(0);
    expect(medicationPatchFromLatestDose(medication, null, +1).penDosesRemaining).toBe(3);
    expect(medicationPatchFromLatestDose({ ...medication, penDosesRemaining: 4 }, null, +1).penDosesRemaining).toBe(4);
  });

  it('nao mexe na caneta quando ela nao e controlada', () => {
    expect(medicationPatchFromLatestDose({ ...medication, penDosesRemaining: null }, null, -1)).toEqual({});
  });
});
