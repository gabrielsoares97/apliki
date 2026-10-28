/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { computeEloProgress, computeHealthPoints, EloProgress } from '../../shared/eloCalc';
import { computeStreak, getAllEntryDateKeys } from './todayService';

async function countCollection(name: string): Promise<number> {
  const snap = await getCountFromServer(collection(db, 'users', getCurrentUid(), name));
  return snap.data().count;
}

/** Busca as contagens de cada tipo de registro (via agregação no servidor, sem baixar os documentos) e calcula o Elo de saúde do usuário. */
export async function getEloProgress(): Promise<EloProgress> {
  const [doseCount, weightCount, waterLogCount, mealCount, activityCount, workoutSessionCount, dateKeys] = await Promise.all([
    countCollection('doseLog'),
    countCollection('weightLog'),
    countCollection('waterLog'),
    countCollection('mealLog'),
    countCollection('activityLog'),
    countCollection('workoutSession'),
    getAllEntryDateKeys(),
  ]);

  const streak = computeStreak(dateKeys);
  const points = computeHealthPoints({ doseCount, weightCount, waterLogCount, mealCount, activityCount, workoutSessionCount, streak });
  return computeEloProgress(points);
}
