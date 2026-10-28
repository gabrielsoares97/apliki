/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { create } from 'zustand';
import { subscribeToAuthChanges, FirebaseUser } from '../firebase/auth';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  startListening: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  authLoading: true,

  startListening: () => {
    return subscribeToAuthChanges((firebaseUser) => {
      set({ firebaseUser, authLoading: false });
    });
  },
}));
