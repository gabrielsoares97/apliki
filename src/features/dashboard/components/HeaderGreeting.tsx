/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';
import { formatDatePt } from '../../../shared/date';

interface HeaderGreetingProps {
  name: string;
  streak: number;
}

export function HeaderGreeting({ name, streak }: HeaderGreetingProps) {
  const today = formatDatePt(new Date());
  const capitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <View style={styles.container}>
      <View>
        <Text style={typography.title}>Olá, {name} 👋</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{capitalized}</Text>
      </View>
      <View style={styles.streak}>
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  streak: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: 999, gap: 4 },
  streakIcon: { fontSize: 16 },
  streakNumber: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
