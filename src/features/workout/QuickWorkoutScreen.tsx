/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { MUSCLE_GROUP_LABELS } from '../../shared/labels';
import { MuscleGroup } from '../../types';
import { generateQuickWorkout } from '../../shared/workoutCalc';

const QUICK_MUSCLE_GROUPS: MuscleGroup[] = ['peito', 'costas', 'ombros', 'biceps', 'triceps', 'quadriceps', 'posterior', 'gluteos', 'abdomen', 'cardio'];
const DURATIONS = [15, 30, 45, 60];

export function QuickWorkoutScreen() {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<MuscleGroup[]>([]);
  const [duration, setDuration] = useState(30);

  function toggleGroup(group: MuscleGroup) {
    setSelected((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function handleGenerate() {
    if (selected.length === 0) return;
    const exercises = generateQuickWorkout(selected, duration);
    if (exercises.length === 0) return;
    navigation.navigate('ActiveWorkout', { generated: { name: 'Treino rápido', exercises } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Escolha o que vai treinar e quanto tempo tem disponível — o app monta a sessão na hora.</Text>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Grupos musculares</Text>
        <View style={styles.chipRow}>
          {QUICK_MUSCLE_GROUPS.map((g) => (
            <Chip key={g} label={MUSCLE_GROUP_LABELS[g]} selected={selected.includes(g)} onPress={() => toggleGroup(g)} />
          ))}
        </View>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Tempo disponível</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>

        <Button label="Gerar treino" onPress={handleGenerate} disabled={selected.length === 0} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  intro: { ...typography.small, lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
