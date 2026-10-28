/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const STORAGE_KEY = 'apliki_biometric_lock_enabled';

export const isBiometricSupportedPlatform = Platform.OS !== 'web';

export async function isBiometricHardwareAvailable(): Promise<boolean> {
  if (!isBiometricSupportedPlatform) return false;
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  if (!isBiometricSupportedPlatform) return false;
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value === '1';
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!isBiometricSupportedPlatform) return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear apliKI',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
