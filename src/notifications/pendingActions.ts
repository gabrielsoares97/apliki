/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/config';
import { newId } from '../db/database';
import { quickLogDose, quickLogWater, QuickDoseResult, QuickWaterResult } from '../shared/quickLog';

/**
 * Fila local das acoes rapidas vindas dos botoes das notificacoes (+ 1 copo, Registrei).
 * O toque so grava na fila (AsyncStorage, instantaneo e sem rede) e depois tentamos enviar ao Firestore:
 * se o app estiver fechado, sem internet ou a sessao ainda nao restaurada, nada se perde — a fila e
 * enviada na proxima abertura do app. Cada acao tem um id fixo, entao reenviar nunca duplica o registro.
 */

/** `uid`: conta conectada quando o botao foi tocado (null em acoes antigas, de antes deste campo). */
export type PendingAction = (
  | { id: string; kind: 'water'; atIso: string; amountMl: number }
  | { id: string; kind: 'dose'; atIso: string }
) & { uid?: string | null };

const QUEUE_KEY = 'apliki.pendingQuickActions';
const HANDLED_KEY = 'apliki.handledNotificationActions';
const SETTINGS_KEY = 'apliki.quickActionSettings';
const MAX_HANDLED_KEYS = 60;

export interface QuickActionSettings {
  cupSizeMl: number;
  goalMl: number;
}

const DEFAULT_SETTINGS: QuickActionSettings = { cupSizeMl: 250, goalMl: 2000 };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Guarda o tamanho do copo para o botao "+ 1 copo" saber a quantidade mesmo com o app fechado. */
export async function saveQuickActionSettings(settings: QuickActionSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => undefined);
}

export async function readQuickActionSettings(): Promise<QuickActionSettings> {
  return { ...DEFAULT_SETTINGS, ...(await readJson<Partial<QuickActionSettings>>(SETTINGS_KEY, {})) };
}

/**
 * Toda leitura-e-gravacao da fila e das respostas tratadas passa por esta corrente, uma de cada vez.
 * Sem isso, um toque que chegava durante o envio era apagado quando o envio gravava a copia antiga da fila.
 */
let storageLock: Promise<unknown> = Promise.resolve();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = storageLock.then(task, task);
  storageLock = run.catch(() => undefined);
  return run;
}

function readQueue(): Promise<PendingAction[]> {
  return readJson<PendingAction[]>(QUEUE_KEY, []);
}

const handledInMemory = new Set<string>();

/** Marca a resposta da notificacao como tratada. Retorna false se ja tinha sido (evita registrar duas vezes). */
export function markNotificationActionHandled(key: string): Promise<boolean> {
  // Com o app aberto a tarefa em segundo plano e o listener podem receber a mesma resposta ao mesmo tempo.
  if (handledInMemory.has(key)) return Promise.resolve(false);
  handledInMemory.add(key);
  return serialized(async () => {
    const handled = await readJson<string[]>(HANDLED_KEY, []);
    if (handled.includes(key)) return false;
    await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify([...handled, key].slice(-MAX_HANDLED_KEYS))).catch(() => undefined);
    return true;
  });
}

type NewPendingAction = { kind: 'water'; atIso: string; amountMl: number } | { kind: 'dose'; atIso: string };

const AUTH_RESTORE_WAIT_MS = 3000;

/** Conta dona da acao. Com o app fechado a sessao ainda pode estar sendo restaurada do armazenamento. */
async function currentUidForQueue(): Promise<string | null> {
  const signedInUid = () => auth.currentUser?.uid ?? null;
  if (signedInUid()) return signedInUid();
  await Promise.race([auth.authStateReady().catch(() => undefined), new Promise((resolve) => setTimeout(resolve, AUTH_RESTORE_WAIT_MS))]);
  return signedInUid();
}

export async function enqueueAction(action: NewPendingAction): Promise<PendingAction> {
  const uid = await currentUidForQueue();
  const full = { ...action, id: newId(), uid } as PendingAction;
  await serialized(async () => {
    const queue = await readQueue();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, full]));
  });
  return full;
}

/** Remove so a acao enviada, relendo a fila (pode ter chegado outra acao enquanto esta era enviada). */
function removeAction(id: string): Promise<void> {
  return serialized(async () => {
    const queue = await readQueue();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter((a) => a.id !== id)));
  });
}

/** Esvazia a fila (chamar ao sair da conta e ao apagar os dados), para nada ir parar em outra conta. */
export function clearPendingActions(): Promise<void> {
  return serialized(async () => {
    await AsyncStorage.multiRemove([QUEUE_KEY, SETTINGS_KEY]).catch(() => undefined);
  });
}

export interface FlushResult {
  flushed: number;
  lastWater?: QuickWaterResult;
  lastDose?: QuickDoseResult | null;
}

function mergeResults(previous: FlushResult, next: FlushResult): FlushResult {
  return {
    flushed: previous.flushed + next.flushed,
    lastWater: next.lastWater ?? previous.lastWater,
    lastDose: next.lastDose !== undefined ? next.lastDose : previous.lastDose,
  };
}

let flushing: Promise<FlushResult> | null = null;

/** Envia a fila ao Firestore, em ordem. Para no primeiro erro e mantem o restante para a proxima tentativa. */
export function flushPendingActions(): Promise<FlushResult> {
  if (flushing) {
    // O envio em andamento pode ja ter visto a fila vazia antes desta chamada: roda mais uma vez depois dele.
    return flushing.then((previous) => flushPendingActions().then((next) => mergeResults(previous, next)));
  }
  flushing = doFlush().finally(() => {
    flushing = null;
  });
  return flushing;
}

async function doFlush(): Promise<FlushResult> {
  const result: FlushResult = { flushed: 0 };
  if ((await readQueue()).length === 0) return result;

  // Com o app fechado a sessao ainda esta sendo restaurada do armazenamento.
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) return result;

  // Rele a fila a cada volta: acoes que chegarem durante o envio tambem saem nesta rodada.
  while (auth.currentUser?.uid === uid) {
    const action = (await serialized(readQueue))[0];
    if (!action) break;

    try {
      if (action.uid && action.uid !== uid) {
        // Tocada com outra conta conectada: nao pode virar registro desta.
        console.warn('[notifications] ação rápida de outra conta descartada.');
      } else if (action.kind === 'water') {
        result.lastWater = await quickLogWater({ id: action.id, at: new Date(action.atIso), amountMl: action.amountMl });
        result.flushed += 1;
      } else {
        result.lastDose = await quickLogDose({ id: action.id, at: new Date(action.atIso) });
        result.flushed += 1;
      }
      await removeAction(action.id);
    } catch (error) {
      console.warn('[notifications] não foi possível enviar a ação rápida, tentará de novo depois.', error);
      break;
    }
  }
  return result;
}
