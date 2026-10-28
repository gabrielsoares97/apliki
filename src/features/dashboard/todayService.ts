/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { doseRepository, weightRepository, waterRepository, mealRepository, activityRepository } from '../../db/repositories';
import { deletePhotosOfLog } from '../weight/photoStore';
import { syncCurrentWeightWithLogs } from '../weight/weightSync';
import { syncMedicationWithDoses } from '../dose/doseSync';
import { TodayEntry, TodayEntryKind } from '../../types';
import { startOfDay, endOfDay, toDateKey, dateKeyOfIso, addDays, formatTimePt } from '../../shared/date';
import { APPLICATION_SITE_LABELS, MEAL_CATEGORY_LABELS } from '../../shared/labels';

/** Retorna o conjunto de dias (YYYY-MM-DD) em que houve pelo menos um registro de qualquer tipo. */
export async function getAllEntryDateKeys(): Promise<Set<string>> {
  const [doses, weights, waters, meals, activities] = await Promise.all([
    doseRepository.listAll(),
    weightRepository.listAll(),
    waterRepository.listAll(),
    mealRepository.listAll(),
    activityRepository.listAll(),
  ]);
  const keys = new Set<string>();
  [...doses, ...weights, ...waters, ...meals, ...activities].forEach((entry) => keys.add(dateKeyOfIso(entry.dateTime)));
  return keys;
}

/** Streak = dias consecutivos com ao menos um registro, contando a partir de hoje (ou de ontem, se hoje ainda não tem registro). */
export function computeStreak(dateKeys: Set<string>, today: Date = new Date()): number {
  let cursor = today;
  if (!dateKeys.has(toDateKey(today))) {
    cursor = addDays(today, -1);
    if (!dateKeys.has(toDateKey(cursor))) return 0;
  }
  let streak = 0;
  while (dateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function getTodayEntries(): Promise<TodayEntry[]> {
  const today = new Date();
  const startIso = startOfDay(today).toISOString();
  const endIso = endOfDay(today).toISOString();

  const [doses, weights, waters, meals, activities] = await Promise.all([
    doseRepository.listBetween(startIso, endIso),
    weightRepository.listBetween(startIso, endIso),
    waterRepository.listBetween(startIso, endIso),
    mealRepository.listBetween(startIso, endIso),
    activityRepository.listBetween(startIso, endIso),
  ]);

  const entries: TodayEntry[] = [
    ...doses.map((d) => ({
      id: d.id,
      kind: 'dose' as TodayEntryKind,
      title: `Dose aplicada — ${d.doseMg}mg`,
      subtitle: d.applicationSite ? APPLICATION_SITE_LABELS[d.applicationSite] : formatTimePt(new Date(d.dateTime)),
      dateTime: d.dateTime,
      raw: d,
    })),
    ...weights.map((w) => ({
      id: w.id,
      kind: 'weight' as TodayEntryKind,
      title: `Peso registrado — ${w.weightKg}kg`,
      subtitle: formatTimePt(new Date(w.dateTime)),
      dateTime: w.dateTime,
      raw: w,
    })),
    ...waters.map((w) => ({
      id: w.id,
      kind: 'water' as TodayEntryKind,
      title: `Água — ${w.amountMl}ml`,
      subtitle: formatTimePt(new Date(w.dateTime)),
      dateTime: w.dateTime,
      raw: w,
    })),
    ...meals.map((m) => ({
      id: m.id,
      kind: 'meal' as TodayEntryKind,
      title: `${MEAL_CATEGORY_LABELS[m.category]} — ${m.name}`,
      subtitle: `${m.calories} kcal · ${formatTimePt(new Date(m.dateTime))}`,
      dateTime: m.dateTime,
      raw: m,
    })),
    ...activities.map((a) => ({
      id: a.id,
      kind: 'activity' as TodayEntryKind,
      title: `${a.type} — ${a.durationMin}min`,
      subtitle: `${a.calories} kcal · ${formatTimePt(new Date(a.dateTime))}`,
      dateTime: a.dateTime,
      raw: a,
    })),
  ];

  return entries.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

export async function deleteEntry(kind: TodayEntryKind, id: string): Promise<void> {
  switch (kind) {
    case 'dose':
      await doseRepository.remove(id);
      // A proxima dose sai da dose que sobrou mais recente e a dose apagada volta para a caneta.
      await syncMedicationWithDoses(+1);
      return;
    case 'weight': {
      // As fotos de progresso ficam em documentos proprios: apaga junto para nao sobrar lixo na conta.
      const log = (await weightRepository.listAll()).find((l) => l.id === id);
      if (log) await deletePhotosOfLog(log);
      await weightRepository.remove(id);
      await syncCurrentWeightWithLogs();
      return;
    }
    case 'water':
      return waterRepository.remove(id);
    case 'meal':
      return mealRepository.remove(id);
    case 'activity':
      return activityRepository.remove(id);
  }
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  waterMl: number;
  activityCalories: number;
}

export async function getTodayTotals(): Promise<DailyTotals> {
  const today = new Date();
  const startIso = startOfDay(today).toISOString();
  const endIso = endOfDay(today).toISOString();

  const [meals, waters, activities] = await Promise.all([
    mealRepository.listBetween(startIso, endIso),
    waterRepository.listBetween(startIso, endIso),
    activityRepository.listBetween(startIso, endIso),
  ]);

  return {
    calories: meals.reduce((s, m) => s + m.calories, 0),
    protein: meals.reduce((s, m) => s + m.protein, 0),
    carb: meals.reduce((s, m) => s + m.carb, 0),
    fat: meals.reduce((s, m) => s + m.fat, 0),
    fiber: meals.reduce((s, m) => s + m.fiber, 0),
    waterMl: waters.reduce((s, w) => s + w.amountMl, 0),
    activityCalories: activities.reduce((s, a) => s + a.calories, 0),
  };
}
