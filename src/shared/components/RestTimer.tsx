/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface RestTimerProps {
  seconds: number;
  onFinish: () => void;
  onSkip: () => void;
  /** Chamado quando o usuario soma tempo, para reagendar o aviso em segundo plano. */
  onExtend?: (newRemainingSeconds: number) => void;
}

const FINISH_VIBRATION = [0, 500, 200, 500, 200, 500];

/** Cronometro de pausa baseado em horario final (nao deriva com o app em segundo plano); vibra ao terminar. */
export function RestTimer({ seconds, onFinish, onSkip, onExtend }: RestTimerProps) {
  const endsAtRef = useRef(Date.now() + seconds * 1000);
  const finishedRef = useRef(false);
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        Vibration.vibrate(FINISH_VIBRATION);
        onFinish();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [onFinish]);

  function extend() {
    endsAtRef.current += 15000;
    const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
    setRemaining(left);
    onExtend?.(left);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pausa</Text>
      <Text style={styles.time}>{mm}:{ss}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={extend}>
          <Text style={styles.actionText}>+15s</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.skipButton]} onPress={onSkip}>
          <Text style={[styles.actionText, styles.skipText]}>Pular</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  label: { ...typography.label, color: colors.primary },
  time: { fontSize: 40, fontWeight: '700', color: colors.primary, marginVertical: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  skipButton: { backgroundColor: colors.primary },
  skipText: { color: colors.white },
});
