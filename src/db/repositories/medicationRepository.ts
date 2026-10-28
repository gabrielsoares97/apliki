/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { Medication } from '../../types';

const MEDICATION_ID = 'current';

function medicationDoc() {
  return doc(db, 'users', getCurrentUid(), 'medication', MEDICATION_ID);
}

export async function getCurrentMedication(): Promise<Medication | null> {
  const snap = await getDoc(medicationDoc());
  if (!snap.exists()) return null;
  return { id: MEDICATION_ID, ...(snap.data() as Omit<Medication, 'id'>) };
}

export async function createMedication(data: Omit<Medication, 'id'>): Promise<Medication> {
  await setDoc(medicationDoc(), data);
  return { id: MEDICATION_ID, ...data };
}

export async function updateMedication(_id: string, patch: Partial<Medication>): Promise<void> {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  await updateDoc(medicationDoc(), patch as Record<string, unknown>);
}

export async function deleteMedication(): Promise<void> {
  await deleteDoc(medicationDoc());
}
