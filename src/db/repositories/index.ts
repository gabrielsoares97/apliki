/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { newId } from '../database';
import { createLogRepository } from './genericRepository';
import { DoseLog, WeightLog, WaterLog, MealLog, ActivityLog, Reminder, SymptomLog, WorkoutSession, WorkoutTemplate } from '../../types';

export const doseRepository = createLogRepository<DoseLog>('doseLog');
export const weightRepository = createLogRepository<WeightLog>('weightLog');
export const waterRepository = createLogRepository<WaterLog>('waterLog');
export const activityRepository = createLogRepository<ActivityLog>('activityLog');
export const symptomRepository = createLogRepository<SymptomLog>('symptomLog');
export const workoutSessionRepository = createLogRepository<WorkoutSession>('workoutSession');

const mealBase = createLogRepository<MealLog>('mealLog');

export const mealRepository = {
  ...mealBase,
  async listFavorites(): Promise<MealLog[]> {
    const col = collection(db, 'users', getCurrentUid(), 'mealLog');
    const snap = await getDocs(query(col, where('isFavorite', '==', true)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as MealLog)
      .sort((a, b) => a.name.localeCompare(b.name));
  },
};

// Reminder não tem campo dateTime (usa times[]/daysOfWeek[]), então usa uma coleção própria.
function reminderCol() {
  return collection(db, 'users', getCurrentUid(), 'reminder');
}

export const reminderRepository = {
  async listAll(): Promise<Reminder[]> {
    const snap = await getDocs(reminderCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reminder);
  },
  async listByType(type: Reminder['type']): Promise<Reminder[]> {
    const snap = await getDocs(query(reminderCol(), where('type', '==', type)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Reminder);
  },
  async insert(data: Omit<Reminder, 'id'>): Promise<Reminder> {
    const id = newId();
    await setDoc(doc(reminderCol(), id), data);
    return { id, ...data };
  },
  async update(id: string, patch: Partial<Reminder>): Promise<void> {
    const fields = Object.keys(patch);
    if (fields.length === 0) return;
    await updateDoc(doc(reminderCol(), id), patch as Record<string, unknown>);
  },
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(reminderCol(), id));
  },
};

function workoutTemplateCol() {
  return collection(db, 'users', getCurrentUid(), 'workoutTemplate');
}

export const workoutTemplateRepository = {
  async listAll(): Promise<WorkoutTemplate[]> {
    const snap = await getDocs(workoutTemplateCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkoutTemplate);
  },
  async insert(data: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> {
    const id = newId();
    await setDoc(doc(workoutTemplateCol(), id), data);
    return { id, ...data };
  },
  async update(id: string, patch: Partial<WorkoutTemplate>): Promise<void> {
    const fields = Object.keys(patch);
    if (fields.length === 0) return;
    await updateDoc(doc(workoutTemplateCol(), id), patch as Record<string, unknown>);
  },
  async remove(id: string): Promise<void> {
    await deleteDoc(doc(workoutTemplateCol(), id));
  },
};
