/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

export type { FirebaseUser };

function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar em vez de criar uma conta nova.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail/senha não está ativado no projeto Firebase. Ative em Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    default:
      return 'Não foi possível completar a operação. Tente novamente.';
  }
}

function rethrowFriendly(error: unknown): never {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  throw new Error(translateAuthError(code));
}

export async function signUp(name: string, email: string, password: string): Promise<FirebaseUser> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(credential.user, { displayName: name.trim() });
    return credential.user;
  } catch (error) {
    rethrowFriendly(error);
  }
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  } catch (error) {
    rethrowFriendly(error);
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    rethrowFriendly(error);
  }
}

/**
 * Exclui a conta de vez: confirma a senha (o Firebase exige login recente), apaga todos os dados e remove o login.
 * Os dados são apagados antes do login porque, sem login, as regras do Firestore não deixam mais apagá-los.
 */
export async function deleteAccount(password: string, deleteData: (uid: string) => Promise<void>): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('Usuário não autenticado.');
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } catch (error) {
    rethrowFriendly(error);
  }
  await deleteData(user.uid);
  try {
    await deleteUser(user);
  } catch (error) {
    rethrowFriendly(error);
  }
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado.');
  return uid;
}
