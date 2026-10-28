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
import { ProgressRing } from '../../../shared/components/ProgressRing';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import { colors, spacing, typography } from '../../../shared/theme';

interface MacroGoals {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fiberGoal: number;
}

interface NutritionCardProps extends MacroGoals {
  calories: number;
  protein: number;
  carb: number;
  fiber: number;
  onEditGoals: () => void;
  onPress: () => void;
}

export function NutritionCard({ calories, protein, carb, fiber, calorieGoal, proteinGoal, carbGoal, fiberGoal, onEditGoals, onPress }: NutritionCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle}>Nutrição</Text>
        <CardAction label="Editar metas" onPress={onEditGoals} />
      </View>
      <View style={styles.row}>
        <ProgressRing progress={calorieGoal > 0 ? calories / calorieGoal : 0} size={96} strokeWidth={10}>
          <Text style={styles.ringValue}>{Math.round(calories)}</Text>
          <Text style={styles.ringLabel}>/ {calorieGoal} kcal</Text>
        </ProgressRing>

        <View style={styles.macros}>
          <MacroRow label="Proteína" value={protein} goal={proteinGoal} color={colors.macroProtein} />
          <MacroRow label="Carboidrato" value={carb} goal={carbGoal} color={colors.macroCarb} />
          <MacroRow label="Fibra" value={fiber} goal={fiberGoal} color={colors.macroFiber} />
        </View>
      </View>

      <CardLink label="Abrir diário de refeições" />
    </Card>
  );
}

function MacroRow({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <View style={{ marginBottom: spacing.xs + 2 }}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{Math.round(value)}/{goal}g</Text>
      </View>
      <ProgressBar progress={goal > 0 ? value / goal : 0} color={color} height={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ringValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  ringLabel: { fontSize: 11, color: colors.textSecondary },
  macros: { flex: 1 },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: 12, color: colors.textSecondary },
  macroValue: { fontSize: 12, color: colors.textSecondary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
});
