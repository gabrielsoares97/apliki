/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// getReactNativePersistence só existe no build React Native de @firebase/auth; o resolvedor de tipos do
// tsc (ao contrário do Metro em tempo de execução) não aplica a condição "react-native" do package.json,
// então essa importação não tem tipagem correspondente — o valor real existe e funciona normalmente.
// @ts-expect-error ver comentário acima
import { getReactNativePersistence } from '@firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cole aqui o objeto `firebaseConfig` copiado do Console do Firebase:
 * Configurações do projeto → Seus apps → app Web (</>) → "Config".
 */
const firebaseConfig = {
  apiKey: 'AIzaSyA3Te3iFfhyiiqv85ymELkYzymuZBEOpo8',
  authDomain: 'monjau-aaae3.firebaseapp.com',
  projectId: 'monjau-aaae3',
  storageBucket: 'monjau-aaae3.firebasestorage.app',
  messagingSenderId: '1086172498761',
  appId: '1:1086172498761:web:9bc1258f66206e1bbc2898',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Em Fast Refresh o auth já foi inicializado nesta sessão do Metro; reaproveita a instância existente.
    return getAuth(app);
  }
}

export const auth = createAuth();

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
