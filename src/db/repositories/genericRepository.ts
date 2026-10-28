/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { newId } from '../database';

/**
 * Factory de CRUD para subcoleções `users/{uid}/{collectionName}` cujos documentos
 * têm um campo `dateTime` (ISO 8601) usado para ordenação e filtro por período.
 */
export function createLogRepository<T extends { id: string; dateTime: string }>(collectionName: string) {
  function col() {
    return collection(db, 'users', getCurrentUid(), collectionName);
  }

  async function listAll(): Promise<T[]> {
    const snap = await getDocs(query(col(), orderBy('dateTime', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  }

  async function listBetween(startIso: string, endIso: string): Promise<T[]> {
    const snap = await getDocs(
      query(col(), where('dateTime', '>=', startIso), where('dateTime', '<=', endIso), orderBy('dateTime', 'desc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  }

  /** `id` opcional permite gravar de forma idempotente (repetir a mesma gravacao nao duplica o registro). */
  async function insert(data: Omit<T, 'id'>, id: string = newId()): Promise<T> {
    await setDoc(doc(col(), id), data);
    return { id, ...data } as T;
  }

  async function update(id: string, patch: Partial<T>): Promise<void> {
    const fields = Object.keys(patch).filter((f) => f !== 'id');
    if (fields.length === 0) return;
    await updateDoc(doc(col(), id), patch as Record<string, unknown>);
  }

  async function remove(id: string): Promise<void> {
    await deleteDoc(doc(col(), id));
  }

  return { listAll, listBetween, insert, update, remove };
}
