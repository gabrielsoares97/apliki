/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface ProgressBarProps {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color = colors.primary, trackColor = colors.border, height = 8, style }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  fill: {
    height: '100%',
  },
});
