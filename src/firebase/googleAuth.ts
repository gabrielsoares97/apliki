/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  type AuthCredential,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Login com Google.
 * - No navegador: janela do próprio Firebase (signInWithPopup).
 * - No celular: seletor de contas nativo do Google; o token que ele devolve vira o login do Firebase.
 *
 * O ID de cliente "web" é o que o Firebase confere no token (o mesmo valor está em google-services.json).
 */
const WEB_CLIENT_ID = '1086172498761-cd5h0rapandalosrm98u6ir89v09rne3.apps.googleusercontent.com';

/** O usuário fechou a janela ou voltou sem escolher uma conta: não é erro, só não acontece nada. */
export class GoogleSignInCancelled extends Error {}

function friendly(error: unknown): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return new GoogleSignInCancelled();
  if (code === 'auth/popup-blocked') return new Error('O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.');
  if (code === 'auth/network-request-failed') return new Error('Sem conexão com a internet.');
  if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
    return new Error('O login com Google ainda não está liberado neste endereço. Entre com e-mail e senha.');
  }
  if (code === 'auth/user-mismatch') return new Error('Escolha a mesma conta Google que você usa no apliKI.');
  return new Error('Não foi possível entrar com o Google. Tente novamente.');
}

/** Abre o seletor de contas nativo e devolve a credencial do Firebase. Só no celular. */
async function nativeGoogleCredential(): Promise<AuthCredential> {
  // Carregado sob demanda: o módulo nativo não existe no navegador nem no Expo Go.
  const google = await import('@react-native-google-signin/google-signin').catch(() => null);
  if (!google) throw new Error('O login com Google não está disponível nesta versão do app. Entre com e-mail e senha.');
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google;
  try {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sai da sessão anterior do Google para o seletor de contas aparecer sempre.
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new GoogleSignInCancelled();
    const idToken = response.data.idToken;
    // Sem token o Firebase não consegue conferir o login; cai na mensagem genérica abaixo.
    if (!idToken) throw new Error('missing_id_token');
    return GoogleAuthProvider.credential(idToken);
  } catch (error) {
    if (error instanceof GoogleSignInCancelled) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        throw new GoogleSignInCancelled();
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Este aparelho não tem o Google Play Services atualizado. Entre com e-mail e senha.');
      }
    }
    throw new Error('Não foi possível entrar com o Google. Tente novamente.');
  }
}

/** Entra (ou cria a conta) com o Google. Lança GoogleSignInCancelled se a pessoa desistir. */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (Platform.OS === 'web') {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return (await signInWithPopup(auth, provider)).user;
    } catch (error) {
      throw friendly(error);
    }
  }
  const credential = await nativeGoogleCredential();
  try {
    return (await signInWithCredential(auth, credential)).user;
  } catch (error) {
    throw friendly(error);
  }
}

/** Confirma a identidade de novo com o Google (exigido pelo Firebase antes de excluir a conta). */
export async function reauthenticateWithGoogle(user: FirebaseUser): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } else {
      await reauthenticateWithCredential(user, await nativeGoogleCredential());
    }
  } catch (error) {
    throw error instanceof GoogleSignInCancelled ? error : friendly(error);
  }
}

/** O login com Google só está configurado para Android e navegador; no iPhone o botão não aparece. */
export const GOOGLE_SIGN_IN_AVAILABLE = Platform.OS !== 'ios';

/** A conta entra pelo Google (e não tem senha própria)? */
export function usesGoogleOnly(user: FirebaseUser | null): boolean {
  if (!user) return false;
  const providers = user.providerData.map((p) => p.providerId);
  return providers.includes('google.com') && !providers.includes('password');
}
