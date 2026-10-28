/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { db } from '../../firebase/config';
import { getCurrentUid } from '../../firebase/auth';
import { newId } from '../../db/database';
import { weightRepository } from '../../db/repositories';
import { WeightLog } from '../../types';

/**
 * Fotos de progresso guardadas na nuvem, junto com os demais dados da conta.
 *
 * Antes o registro de peso guardava so o caminho do arquivo no aparelho (uma pasta de cache do seletor
 * de imagens): limpar o cache/dados do app ou trocar de aparelho apagava as fotos. Agora cada foto e
 * reduzida, enviada ao Firestore em `users/{uid}/weightPhoto/{id}` e o registro de peso guarda a
 * referencia `cloud:{id}`. A copia em disco e so um cache: se sumir, a foto e baixada de novo.
 */

const CLOUD_PREFIX = 'cloud:';
const COLLECTION = 'weightPhoto';
const UPLOAD_TIMEOUT_MS = 30000;
/** Um documento do Firestore aceita ate 1 MiB; a foto vai em base64 e precisa caber com folga. */
const MAX_BASE64_LENGTH = 900000;
const ENCODE_ATTEMPTS = [
  { width: 1080, compress: 0.6 },
  { width: 900, compress: 0.5 },
  { width: 720, compress: 0.4 },
  { width: 540, compress: 0.3 },
];

const PHOTO_FIELDS = ['photoFrontUri', 'photoSideUri', 'photoBackUri'] as const;

export function isCloudPhoto(ref: string | null | undefined): ref is string {
  return !!ref && ref.startsWith(CLOUD_PREFIX);
}

function photoDoc(photoId: string) {
  return doc(db, 'users', getCurrentUid(), COLLECTION, photoId);
}

function cacheFile(photoId: string): File {
  const dir = new Directory(Paths.document, 'weight-photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return new File(dir, `${photoId}.jpg`);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado ao enviar a foto.')), ms)),
  ]);
}

async function encodeForUpload(sourceUri: string): Promise<string> {
  for (const { width, compress } of ENCODE_ATTEMPTS) {
    const context = ImageManipulator.manipulate(sourceUri);
    context.resize({ width });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    if (result.base64 && result.base64.length <= MAX_BASE64_LENGTH) return result.base64;
  }
  throw new Error('A foto é grande demais para ser enviada.');
}

/** Envia a foto do aparelho para a nuvem e devolve a referencia a guardar no registro de peso. */
export async function uploadPhoto(sourceUri: string): Promise<string> {
  const base64 = await encodeForUpload(sourceUri);
  const photoId = newId();
  await withTimeout(setDoc(photoDoc(photoId), { data: base64, createdAt: new Date().toISOString() }), UPLOAD_TIMEOUT_MS);
  if (Platform.OS !== 'web') {
    try {
      cacheFile(photoId).write(base64, { encoding: 'base64' });
    } catch {
      // O cache local e opcional: sem ele a foto e baixada quando for exibida.
    }
  }
  return `${CLOUD_PREFIX}${photoId}`;
}

const resolving = new Map<string, Promise<string | null>>();

/** Converte a referencia guardada no registro em algo que o <Image> consegue abrir. Null se a foto nao existe mais. */
export function resolvePhotoUri(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return Promise.resolve(null);
  const pending = resolving.get(ref);
  if (pending) return pending;
  const promise = doResolve(ref).catch(() => null);
  resolving.set(ref, promise);
  // Falhas (ex.: sem internet) nao ficam em cache, para tentar de novo na proxima exibicao.
  promise.then((uri) => {
    if (!uri) resolving.delete(ref);
  });
  return promise;
}

async function doResolve(ref: string): Promise<string | null> {
  if (!isCloudPhoto(ref)) {
    // Foto antiga, ainda so no aparelho: so serve se o arquivo continuar la.
    if (Platform.OS === 'web') return ref;
    return new File(ref).exists ? ref : null;
  }

  const photoId = ref.slice(CLOUD_PREFIX.length);
  if (Platform.OS !== 'web') {
    const file = cacheFile(photoId);
    if (file.exists && file.size > 0) return file.uri;
  }

  const snap = await getDoc(photoDoc(photoId));
  const base64 = snap.exists() ? (snap.data().data as string | undefined) : undefined;
  if (!base64) return null;
  if (Platform.OS === 'web') return `data:image/jpeg;base64,${base64}`;

  const file = cacheFile(photoId);
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

/** Apaga a foto da nuvem e do cache. Referencias antigas (arquivo local) sao ignoradas. */
export async function deletePhoto(ref: string | null | undefined): Promise<void> {
  if (!isCloudPhoto(ref)) return;
  const photoId = ref.slice(CLOUD_PREFIX.length);
  resolving.delete(ref);
  try {
    await deleteDoc(photoDoc(photoId));
    if (Platform.OS !== 'web') {
      const file = cacheFile(photoId);
      if (file.exists) file.delete();
    }
  } catch (error) {
    console.warn('[photos] não foi possível apagar a foto.', error);
  }
}

/** Apaga as copias das fotos guardadas no aparelho (ao apagar os dados ou sair da conta). A nuvem nao e tocada. */
export function clearLocalPhotoCache(): void {
  resolving.clear();
  if (Platform.OS === 'web') return;
  try {
    const dir = new Directory(Paths.document, 'weight-photos');
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn('[photos] não foi possível limpar as fotos do aparelho.', error);
  }
}

export async function deletePhotosOfLog(log: Pick<WeightLog, (typeof PHOTO_FIELDS)[number]>): Promise<void> {
  await Promise.all(PHOTO_FIELDS.map((field) => deletePhoto(log[field])));
}

let migrating: Promise<void> | null = null;

/**
 * Envia para a nuvem as fotos registradas antes desta mudanca, enquanto o arquivo ainda existe no
 * aparelho. Roda em segundo plano a cada abertura do app; o que falhar e tentado de novo na proxima.
 */
export function migrateLegacyPhotos(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  if (!migrating) {
    migrating = doMigrate()
      .catch((error) => console.warn('[photos] migração das fotos antigas falhou, tentará de novo depois.', error))
      .finally(() => {
        migrating = null;
      });
  }
  return migrating;
}

async function doMigrate(): Promise<void> {
  const logs = await weightRepository.listAll();
  for (const log of logs) {
    const patch: Partial<WeightLog> = {};
    for (const field of PHOTO_FIELDS) {
      const ref = log[field];
      if (!ref || isCloudPhoto(ref)) continue;
      let exists = false;
      try {
        exists = new File(ref).exists;
      } catch {
        exists = false;
      }
      if (!exists) continue;
      patch[field] = await uploadPhoto(ref);
    }
    if (Object.keys(patch).length > 0) await weightRepository.update(log.id, patch);
  }
}
