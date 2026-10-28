/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { User } from '../../types';

const DEFAULT_USER_FIELDS: Omit<User, 'id' | 'name'> = {
  age: null,
  heightCm: null,
  startWeightKg: null,
  currentWeightKg: null,
  goalWeightKg: null,
  sex: null,
  activityLevel: null,
  treatmentStage: null,
  weeklyPaceGoalKg: null,
  motivations: [],
  dailyWaterGoalMl: 2000,
  cupSizeMl: 250,
  dailyCalorieGoal: 2000,
  dailyProteinGoal: 120,
  dailyCarbGoal: 200,
  dailyFatGoal: 60,
  dailyFiberGoal: 25,
  notifyDose: true,
  notifyWater: true,
  notifyMeal: true,
  notifyActivity: true,
  dashboardOrder: '["nextDose","weight","water","nutrition","activity"]',
  onboardingDismissed: false,
  onboardingCompleted: false,
  nutritionGoalsSet: false,
};

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

export async function getUser(): Promise<User | null> {
  const uid = getCurrentUid();
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return { id: uid, ...(snap.data() as Omit<User, 'id'>) };
}

/** Cria o documento de perfil na primeira vez que um usuário autenticado é visto (chamar após login/cadastro). */
export async function ensureUserDoc(uid: string, name: string): Promise<User> {
  const ref = userDoc(uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const data = existing.data() as Omit<User, 'id'>;
    // No cadastro, o listener de autenticação pode criar o perfil antes do nome chegar; completa depois.
    if (!data.name && name.trim()) {
      // Sem assinatura válida as regras recusam a gravação; o nome fica para a próxima entrada.
      await updateDoc(ref, { name: name.trim() }).catch(() => undefined);
      return { id: uid, ...data, name: name.trim() };
    }
    return { id: uid, ...data };
  }
  const fresh: Omit<User, 'id'> = { name, ...DEFAULT_USER_FIELDS };
  await setDoc(ref, fresh);
  return { id: uid, ...fresh };
}

export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  await updateDoc(userDoc(id), patch as Record<string, unknown>);
}
