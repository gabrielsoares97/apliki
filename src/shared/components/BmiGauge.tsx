/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { BMI_SEGMENTS, getBmiScalePosition } from '../bmi';

interface BmiGaugeProps {
  bmi: number;
}

export function BmiGauge({ bmi }: BmiGaugeProps) {
  const position = getBmiScalePosition(bmi) * 100;

  return (
    <View style={styles.container}>
      <View style={[styles.markerWrap, { left: `${position}%` }]}>
        <Text style={styles.youAreHere}>Você está aqui</Text>
        <Text style={styles.arrow}>▼</Text>
      </View>

      <View style={styles.barRow}>
        {BMI_SEGMENTS.map((segment) => (
          <View
            key={segment.label}
            style={{ flex: segment.max - segment.min, backgroundColor: segment.color }}
          />
        ))}
      </View>

      <View style={[styles.dotWrap, { left: `${position}%` }]}>
        <View style={styles.dot} />
      </View>

      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Bom</Text>
        <Text style={styles.scaleLabel}>Muito ruim</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm, paddingTop: 28 },
  markerWrap: { position: 'absolute', top: 0, width: 96, marginLeft: -48, alignItems: 'center' },
  youAreHere: { fontSize: 11, fontWeight: '700', color: colors.textPrimary, marginBottom: 1 },
  arrow: { fontSize: 12, color: colors.textPrimary, lineHeight: 12 },
  barRow: { flexDirection: 'row', height: 10, borderRadius: radius.full, overflow: 'hidden' },
  dotWrap: { position: 'absolute', top: 28 - 3, width: 16, marginLeft: -8, alignItems: 'center' },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  scaleLabel: { fontSize: 11, color: colors.textSecondary },
});
