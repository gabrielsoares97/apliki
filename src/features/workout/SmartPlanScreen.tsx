/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { EQUIPMENT_LABELS } from '../../shared/labels';
import { EquipmentType, WorkoutGoal, WorkoutLevel } from '../../types';
import { generateSmartPlan } from '../../shared/workoutCalc';
import { workoutTemplateRepository } from '../../db/repositories';

const GOALS: { key: WorkoutGoal; label: string }[] = [
  { key: 'hipertrofia', label: 'Ganhar massa muscular' },
  { key: 'emagrecimento', label: 'Emagrecer' },
  { key: 'forca', label: 'Ganhar força' },
  { key: 'resistencia', label: 'Resistência/condicionamento' },
];

const LEVELS: { key: WorkoutLevel; label: string }[] = [
  { key: 'iniciante', label: 'Iniciante' },
  { key: 'intermediario', label: 'Intermediário' },
  { key: 'avancado', label: 'Avançado' },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5];

const EQUIPMENT_OPTIONS: EquipmentType[] = ['peso_corporal', 'halteres', 'barra', 'maquina', 'cabo', 'kettlebell', 'elastico'];

export function SmartPlanScreen() {
  const navigation = useNavigation<any>();
  const [goal, setGoal] = useState<WorkoutGoal>('hipertrofia');
  const [level, setLevel] = useState<WorkoutLevel>('iniciante');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState<EquipmentType[]>(['peso_corporal', 'halteres', 'maquina', 'cabo', 'barra']);
  const [generating, setGenerating] = useState(false);

  function toggleEquipment(item: EquipmentType) {
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));
  }

  async function handleGenerate() {
    if (equipment.length === 0) {
      Alert.alert('Selecione ao menos um equipamento', 'Marque o que você tem acesso (pode ser só "Peso do corpo").');
      return;
    }
    if (generating) return;
    const days = generateSmartPlan({ goal, level, daysPerWeek, equipment });
    if (days.length === 0) {
      Alert.alert('Nenhum exercício encontrado', 'Não há exercícios para os equipamentos marcados. Marque mais opções (ex.: "Peso do corpo").');
      return;
    }
    setGenerating(true);
    try {
      for (const day of days) {
        await workoutTemplateRepository.insert({ name: day.name, exercises: day.exercises, createdAt: new Date().toISOString() });
      }
    } catch {
      Alert.alert('Não foi possível salvar o plano', 'Verifique sua conexão com a internet e tente de novo. Treinos já salvos aparecem em Meus treinos.');
      return;
    } finally {
      setGenerating(false);
    }
    const createdText =
      days.length === 1
        ? 'Criamos 1 treino com base nas suas respostas, salvo em Meus treinos.'
        : `Criamos ${days.length} treinos com base nas suas respostas, salvos em Meus treinos.`;
    Alert.alert('Plano gerado! 🎉', createdText, [
      { text: 'OK', onPress: () => navigation.navigate('MyWorkouts') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Responda algumas perguntas e o app monta um plano de treino calculado para o seu objetivo, nível e disponibilidade.
        </Text>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Qual seu objetivo?</Text>
        <View style={styles.chipRow}>
          {GOALS.map((g) => (
            <Chip key={g.key} label={g.label} selected={goal === g.key} onPress={() => setGoal(g.key)} />
          ))}
        </View>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Qual seu nível de experiência?</Text>
        <View style={styles.chipRow}>
          {LEVELS.map((l) => (
            <Chip key={l.key} label={l.label} selected={level === l.key} onPress={() => setLevel(l.key)} />
          ))}
        </View>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Quantos dias por semana?</Text>
        <View style={styles.chipRow}>
          {DAYS_OPTIONS.map((d) => (
            <Chip key={d} label={`${d}x`} selected={daysPerWeek === d} onPress={() => setDaysPerWeek(d)} />
          ))}
        </View>

        <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Quais equipamentos você tem acesso?</Text>
        <View style={styles.chipRow}>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <Chip key={eq} label={EQUIPMENT_LABELS[eq]} selected={equipment.includes(eq)} onPress={() => toggleEquipment(eq)} />
          ))}
        </View>

        <Button label="Gerar plano" onPress={handleGenerate} loading={generating} style={{ marginTop: spacing.xl }} />
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
