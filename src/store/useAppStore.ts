/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { create } from 'zustand';
import { User, Medication } from '../types';
import { getUser, ensureUserDoc, updateUser as updateUserDb } from '../db/repositories/userRepository';
import { getCurrentMedication, updateMedication as updateMedicationDb } from '../db/repositories/medicationRepository';
import { ensureSubscription } from '../firebase/subscription';

// Primeira entrada faz até 4 idas ao servidor em sequência (assinatura e perfil), então o prazo é folgado.
const LOAD_TIMEOUT_MS = 20000;

/** Cada carregamento ganha um número; resultados de um carregamento antigo (logout no meio, cadastro e
 * listener de autenticação disparando juntos) são descartados em vez de sobrescrever o estado atual. */
let loadSeq = 0;

/** O SDK do Firestore pode ficar tentando de novo silenciosamente (sem rejeitar a Promise) quando o
 * banco não existe, a API está desativada ou não há conexão. Esse timeout evita que o app fique
 * preso pra sempre na tela de carregamento nesses casos. */
function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), LOAD_TIMEOUT_MS)),
  ]);
}

interface AppState {
  user: User | null;
  medication: Medication | null;
  version: number;
  loading: boolean;
  loadError: string | null;
  /** Carrega o perfil do usuário autenticado, criando o documento na primeira vez (pós-cadastro). */
  loadForUser: (uid: string, fallbackName: string) => Promise<void>;
  clear: () => void;
  refreshUser: () => Promise<void>;
  refreshMedication: () => Promise<void>;
  patchUser: (patch: Partial<User>) => Promise<void>;
  patchMedication: (patch: Partial<Medication>) => Promise<void>;
  /** Chame após qualquer inserção/edição/remoção de registro para notificar telas que dependem de dados agregados (ex.: dashboard). */
  bump: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  medication: null,
  version: 0,
  loading: true,
  loadError: null,

  loadForUser: async (uid, fallbackName) => {
    const seq = ++loadSeq;
    set({ loading: true, loadError: null });
    try {
      const [user, medication] = await withTimeout(
        (async () => {
          // A assinatura (teste grátis na primeira vez) precisa existir antes do perfil: as regras do
          // Firestore só aceitam gravar dados com assinatura válida.
          await ensureSubscription(uid);
          return Promise.all([ensureUserDoc(uid, fallbackName), getCurrentMedication()]);
        })(),
        'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
      );
      if (seq !== loadSeq) return;
      set({ user, medication, loading: false });
    } catch (error) {
      if (seq !== loadSeq) return;
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
      const message =
        code === 'permission-denied'
          ? 'O servidor recusou o acesso desta conta. Se a assinatura venceu, fale com o apliKI; se o problema continuar, saia e entre de novo.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível carregar seus dados.';
      set({ loading: false, loadError: message });
    }
  },

  clear: () => {
    loadSeq++;
    set({ user: null, medication: null, loading: false, loadError: null });
  },

  refreshUser: async () => {
    const user = await getUser();
    set({ user });
  },

  refreshMedication: async () => {
    const medication = await getCurrentMedication();
    set({ medication });
  },

  patchUser: async (patch) => {
    const current = get().user;
    if (!current) return;
    await updateUserDb(current.id, patch);
    set({ user: { ...current, ...patch } });
  },

  patchMedication: async (patch) => {
    const current = get().medication;
    if (!current) return;
    await updateMedicationDb(current.id, patch);
    set({ medication: { ...current, ...patch } });
  },

  bump: () => set((s) => ({ version: s.version + 1 })),
}));
