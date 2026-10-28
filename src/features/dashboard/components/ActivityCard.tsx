/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { CardAction } from '../../../shared/components/CardParts';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { WEEKDAY_LABELS_SHORT, startOfDay, toDateKey } from '../../../shared/date';

interface ActivityCardProps {
  todayCalories: number;
  weekActivityDateKeys: Set<string>;
  onAdd: () => void;
}

export function ActivityCard({ todayCalories, weekActivityDateKeys, onAdd }: ActivityCardProps) {
  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, []);

  const todayKey = toDateKey(new Date());

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle}>Atividades</Text>
        <CardAction label="+ Registrar" onPress={onAdd} />
      </View>

      <Text style={typography.big}>{Math.round(todayCalories)} kcal</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm }}>gastas hoje</Text>

      <View style={styles.weekRow}>
        {weekDays.map((d, i) => {
          const key = toDateKey(d);
          const hasActivity = weekActivityDateKeys.has(key);
          const isToday = key === todayKey;
          return (
            <View key={key} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{WEEKDAY_LABELS_SHORT[i]}</Text>
              <View style={[styles.dayDot, hasActivity && styles.dayDotFilled, isToday && styles.dayDotToday]} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 11, color: colors.textSecondary },
  dayDot: { width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  dayDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayDotToday: { borderWidth: 2, borderColor: colors.textPrimary },
});
