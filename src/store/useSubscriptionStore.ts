/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { create } from 'zustand';
import {
  effectiveStatus,
  subscribeToSubscription,
  type EffectiveStatus,
  type Subscription,
} from '../firebase/subscription';

interface SubscriptionState {
  subscription: Subscription | null;
  status: EffectiveStatus;
  /** true até a primeira leitura da assinatura chegar. */
  loading: boolean;
  /** Acompanha a assinatura em tempo real: quando o admin ativa a conta, o app libera na hora. */
  startListening: (uid: string) => () => void;
  /** Recalcula a situação (ex.: o teste venceu com o app aberto). */
  recompute: () => void;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  status: 'none',
  loading: true,

  startListening: (uid) => {
    set({ loading: true });
    return subscribeToSubscription(
      uid,
      (subscription) => set({ subscription, status: effectiveStatus(subscription), loading: false }),
      // Erro do listener: mantém o que já se sabia (o servidor continua barrando gravações sem assinatura).
      () => set({ status: effectiveStatus(get().subscription), loading: false })
    );
  },

  recompute: () => {
    const next = effectiveStatus(get().subscription);
    if (next !== get().status) set({ status: next });
  },

  clear: () => set({ subscription: null, status: 'none', loading: true }),
}));
