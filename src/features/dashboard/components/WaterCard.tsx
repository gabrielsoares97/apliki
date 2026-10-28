/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { CardAction } from '../../../shared/components/CardParts';
import { colors, spacing, typography } from '../../../shared/theme';
import { WaterLog } from '../../../types';
import { waterRepository } from '../../../db/repositories';

interface WaterCardProps {
  goalMl: number;
  cupSizeMl: number;
  todayLogs: WaterLog[];
  onChanged: () => void;
  onOpenReminders: () => void;
}

export function WaterCard({ goalMl, cupSizeMl, todayLogs, onChanged, onOpenReminders }: WaterCardProps) {
  const consumedMl = useMemo(() => todayLogs.reduce((s, l) => s + l.amountMl, 0), [todayLogs]);
  const cupsTotal = Math.max(4, Math.ceil(goalMl / cupSizeMl));
  const filledCups = Math.min(cupsTotal, Math.round(consumedMl / cupSizeMl));

  // Logs ordenados do mais antigo ao mais recente, para remover sempre o último ao esvaziar um copo.
  const sortedLogs = useMemo(
    () => [...todayLogs].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [todayLogs]
  );

  async function handleCupPress(index: number) {
    if (index < filledCups) {
      const toRemove = sortedLogs[sortedLogs.length - 1];
      if (toRemove) await waterRepository.remove(toRemove.id);
    } else if (index === filledCups) {
      await waterRepository.insert({ amountMl: cupSizeMl, dateTime: new Date().toISOString() });
    } else {
      return;
    }
    onChanged();
  }

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={typography.subtitle}>Água</Text>
        <Text style={styles.total}>{consumedMl} / {goalMl} ml</Text>
      </View>
      <View style={styles.cupsGrid}>
        {Array.from({ length: cupsTotal }).map((_, i) => (
          <Pressable key={i} onPress={() => handleCupPress(i)} style={styles.cupWrap} disabled={i > filledCups}>
            <View style={[styles.cup, i < filledCups && styles.cupFilled, i === filledCups && styles.cupNext]}>
              <Text style={[styles.cupIcon, i > filledCups && styles.cupIconIdle]}>{i < filledCups ? '💧' : i === filledCups ? '+' : '🥛'}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.hint}>Toque no próximo copo para registrar. Toque em um copo cheio para desfazer.</Text>
        <CardAction label="🔔 Lembretes" onPress={onOpenReminders} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  total: { fontSize: 13, color: colors.water, fontWeight: '700' },
  cupsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cupWrap: { width: '16.66%', alignItems: 'center', paddingVertical: spacing.xs },
  cup: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  cupFilled: { backgroundColor: colors.waterLight },
  // O proximo copo e o unico que registra: ganha contorno e "+" para mostrar onde tocar.
  cupNext: { borderWidth: 2, borderColor: colors.water, borderStyle: 'dashed' },
  cupIcon: { fontSize: 22, color: colors.water, fontWeight: '700' },
  cupIconIdle: { opacity: 0.35 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  hint: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
});
