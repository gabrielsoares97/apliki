/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { CardAction, CardLink } from '../../../shared/components/CardParts';
import { colors, spacing, typography } from '../../../shared/theme';

interface WeightCardProps {
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  onAdd: () => void;
  onPress: () => void;
}

export function WeightCard({ currentWeightKg, goalWeightKg, onAdd, onPress }: WeightCardProps) {
  const diff = currentWeightKg != null && goalWeightKg != null ? currentWeightKg - goalWeightKg : null;

  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle}>Peso</Text>
        <CardAction label="+ Registrar" onPress={onAdd} />
      </View>

      <Text style={typography.big}>{currentWeightKg != null ? `${currentWeightKg} kg` : '—'}</Text>
      {goalWeightKg != null && (
        <Text style={styles.subLine}>
          Meta: {goalWeightKg} kg{diff != null && diff > 0 ? ` · faltam ${diff.toFixed(1)} kg` : diff != null && diff <= 0 ? ' · meta alcançada 🎉' : ''}
        </Text>
      )}

      <CardLink label="Ver evolução e fotos" />
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  subLine: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs },
});
