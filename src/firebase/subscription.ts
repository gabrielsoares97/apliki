/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './config';

/**
 * Assinatura do apliKI. Quem decide se a conta pode gravar dados e usar a IA é o servidor (regras do Firestore e
 * Worker da IA); o app só lê o mesmo documento para mostrar a situação e a tela de assinatura.
 */
export type SubscriptionStatus = 'trial' | 'active' | 'canceled';
export type EffectiveStatus = 'active' | 'trial' | 'expired' | 'canceled' | 'none';

export interface Subscription {
  status: SubscriptionStatus;
  plan: string;
  expiresAt: Timestamp | null;
}

/** Duração do teste grátis criado na primeira entrada. As regras aceitam no máximo 7 dias. */
const TRIAL_MS = 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;

export function effectiveStatus(sub: Subscription | null, now = Date.now()): EffectiveStatus {
  if (!sub) return 'none';
  if (sub.status === 'canceled') return 'canceled';
  const expires = sub.expiresAt?.toMillis() ?? null;
  if (expires === null) return sub.status === 'active' ? 'active' : 'expired';
  return expires > now ? sub.status : 'expired';
}

export function hasAccess(status: EffectiveStatus): boolean {
  return status === 'active' || status === 'trial';
}

/** Dias inteiros até o vencimento (0 = vence hoje), ou null quando não vence. */
export function daysLeft(sub: Subscription | null, now = Date.now()): number | null {
  const expires = sub?.expiresAt?.toMillis();
  if (!expires) return null;
  return Math.max(0, Math.ceil((expires - now) / 86_400_000));
}

function subscriptionDoc(uid: string) {
  return doc(db, 'subscriptions', uid);
}

/** Na primeira entrada da conta, cria o teste grátis. Contas que já têm assinatura não mudam. */
export async function ensureSubscription(uid: string): Promise<void> {
  const snap = await getDoc(subscriptionDoc(uid));
  if (snap.exists()) return;
  try {
    await setDoc(subscriptionDoc(uid), {
      status: 'trial',
      plan: 'trial',
      expiresAt: Timestamp.fromMillis(Date.now() + TRIAL_MS),
      note: null,
      updatedAt: serverTimestamp(),
      updatedBy: 'app',
    });
  } catch (error) {
    // No cadastro, o listener de autenticação e a tela de cadastro chamam isto ao mesmo tempo: quem chega
    // depois vira "atualização" e as regras recusam. Se o teste já foi criado pela outra chamada, está tudo certo.
    const again = await getDoc(subscriptionDoc(uid));
    if (!again.exists()) throw error;
  }
}

/** `onError` não muda a assinatura conhecida: um erro passageiro não deve mostrar a tela de assinatura. */
export function subscribeToSubscription(
  uid: string,
  callback: (sub: Subscription | null) => void,
  onError: () => void
): () => void {
  return onSnapshot(
    subscriptionDoc(uid),
    (snap) => {
      // Offline e sem cópia em cache, o Firestore responde "não existe" sem ter consultado o servidor.
      if (!snap.exists() && snap.metadata.fromCache) return;
      callback(snap.exists() ? (snap.data() as Subscription) : null);
    },
    onError
  );
}

/**
 * Mantém accounts/{uid} (nome, e-mail, último acesso, aparelho) para o painel administrativo listar as contas.
 * Nenhum dado de saúde vai para esse documento.
 */
export async function touchAccount(user: FirebaseUser, name: string): Promise<void> {
  if (!user.email) return;
  const ref = doc(db, 'accounts', user.uid);
  const fields = {
    email: user.email,
    name: name.slice(0, 80),
    lastSeenAt: serverTimestamp(),
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? null,
  };
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, fields);
  } else {
    await setDoc(ref, { ...fields, createdAt: serverTimestamp() });
  }
}
