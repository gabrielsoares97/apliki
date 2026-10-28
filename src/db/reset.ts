/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { collection, deleteDoc, doc, getDocs, limit, query, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateUser } from './repositories/userRepository';
import { clearPendingActions } from '../notifications/pendingActions';
import { clearLocalPhotoCache } from '../features/weight/photoStore';
import { User } from '../types';

const LOG_COLLECTIONS = ['doseLog', 'weightLog', 'weightPhoto', 'waterLog', 'mealLog', 'activityLog', 'reminder', 'symptomLog', 'workoutSession', 'workoutTemplate'];
const BATCH_SIZE = 400;
const PHOTO_PAGE_SIZE = 5;

const BLANK_USER_FIELDS: Partial<User> = {
  name: '',
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

/** Apaga em lotes pequenos: fotos de progresso têm até ~900 KB cada e baixar todas de uma vez estoura a memória. */
async function deleteAllInCollection(userId: string, collectionName: string): Promise<void> {
  const pageSize = collectionName === 'weightPhoto' ? PHOTO_PAGE_SIZE : BATCH_SIZE;
  for (;;) {
    const snap = await getDocs(query(collection(db, 'users', userId, collectionName), limit(pageSize)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
    if (snap.size < pageSize) return;
  }
}

/**
 * Apaga todos os registros do usuário autenticado (doses, pesos, água, refeições,
 * atividades, lembretes, sintomas e medicamento) e zera o perfil, mantendo a mesma
 * conta para não deixar o app sem perfil no meio da sessão.
 */
export async function resetAllData(userId: string): Promise<void> {
  for (const collectionName of LOG_COLLECTIONS) {
    await deleteAllInCollection(userId, collectionName);
  }
  await deleteDoc(doc(db, 'users', userId, 'medication', 'current')).catch(() => {});
  await updateUser(userId, BLANK_USER_FIELDS);
  // Dados que ficam so no aparelho: acoes rapidas ainda nao enviadas (recriariam registros apagados)
  // e as copias locais das fotos de progresso.
  await clearPendingActions();
  clearLocalPhotoCache();
}

/**
 * Exclusão definitiva da conta (LGPD e exigência das lojas): apaga todos os registros, o perfil e a ficha da
 * conta. A remoção do login em si fica com deleteAccount() em firebase/auth.ts, que chama esta função antes.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  for (const collectionName of LOG_COLLECTIONS) {
    await deleteAllInCollection(userId, collectionName);
  }
  await deleteDoc(doc(db, 'users', userId, 'medication', 'current')).catch(() => {});
  await deleteDoc(doc(db, 'users', userId));
  await deleteDoc(doc(db, 'accounts', userId)).catch(() => {});
  await clearPendingActions();
  clearLocalPhotoCache();
}
