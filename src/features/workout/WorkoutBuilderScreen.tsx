/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TextField } from '../../shared/components/TextField';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { IconButton } from '../../shared/components/IconButton';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { workoutTemplateRepository } from '../../db/repositories';
import { Exercise, TemplateExercise, WorkoutTemplate } from '../../types';
import { getExerciseById } from '../../shared/exerciseCatalog';
import { ExercisePickerModal } from './ExercisePickerModal';

export function WorkoutBuilderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingTemplate: WorkoutTemplate | undefined = route.params?.template;

  const [name, setName] = useState(editingTemplate?.name ?? '');
  const [exercises, setExercises] = useState<TemplateExercise[]>(editingTemplate?.exercises ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editingTemplate ? 'Editar treino' : 'Novo treino' });
  }, [navigation, editingTemplate]);

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [...prev, { exerciseId: exercise.id, sets: 3, reps: 12, restSec: 60, notes: null }]);
    setPickerOpen(false);
  }

  function updateExercise(index: number, patch: Partial<TemplateExercise>) {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim() || exercises.length === 0) {
      Alert.alert('Preencha os dados', 'Dê um nome ao treino e adicione ao menos um exercício.');
      return;
    }
    if (editingTemplate) {
      await workoutTemplateRepository.update(editingTemplate.id, { name: name.trim(), exercises });
    } else {
      await workoutTemplateRepository.insert({ name: name.trim(), exercises, createdAt: new Date().toISOString() });
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="Nome do treino" value={name} onChangeText={setName} placeholder="Ex: Treino A — Peito e Tríceps" />

        <Text style={[typography.subtitle, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>Exercícios</Text>

        {exercises.length === 0 && (
          <Card style={{ marginBottom: spacing.md }}>
            <EmptyState
              icon="🏋️"
              title="Nenhum exercício adicionado ainda"
              description="Toque em “Adicionar exercício” para montar seu treino."
            />
          </Card>
        )}

        {exercises.map((templateExercise, index) => {
          const exercise = getExerciseById(templateExercise.exerciseId);
          return (
            <Card key={`${templateExercise.exerciseId}-${index}`} style={{ marginBottom: spacing.sm }}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise?.name ?? templateExercise.exerciseId}</Text>
                <Pressable
                  onPress={() => removeExercise(index)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${exercise?.name ?? 'exercício'}`}
                >
                  <Text style={styles.removeText}>Remover</Text>
                </Pressable>
              </View>

              <View style={styles.fieldsRow}>
                <NumberField label="Séries" value={templateExercise.sets} onChange={(v) => updateExercise(index, { sets: v })} />
                <NumberField label="Reps" value={templateExercise.reps} onChange={(v) => updateExercise(index, { reps: v })} />
                <NumberField label="Descanso (s)" value={templateExercise.restSec} onChange={(v) => updateExercise(index, { restSec: v })} step={15} />
              </View>

              <View style={styles.moveRow}>
                <Pressable
                  style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                  onPress={() => moveExercise(index, -1)}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Subir exercício"
                  accessibilityState={{ disabled: index === 0 }}
                >
                  <Text style={styles.moveButtonText}>▲ Subir</Text>
                </Pressable>
                <Pressable
                  style={[styles.moveButton, index === exercises.length - 1 && styles.moveButtonDisabled]}
                  onPress={() => moveExercise(index, 1)}
                  disabled={index === exercises.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel="Descer exercício"
                  accessibilityState={{ disabled: index === exercises.length - 1 }}
                >
                  <Text style={styles.moveButtonText}>▼ Descer</Text>
                </Pressable>
              </View>
            </Card>
          );
        })}

        <Button label="+ Adicionar exercício" variant="secondary" onPress={() => setPickerOpen(true)} />

        <Button label="Salvar treino" onPress={handleSave} style={{ marginTop: spacing.lg }} />
      </ScrollView>

      <ExercisePickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={addExercise} title="Adicionar exercício" />
    </SafeAreaView>
  );
}

function NumberField({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <View style={styles.numberField}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.stepper}>
        <IconButton
          icon={<Text style={styles.stepButtonText}>−</Text>}
          onPress={() => onChange(Math.max(0, value - step))}
          accessibilityLabel={`Diminuir ${label.toLowerCase()}`}
          variant="tinted"
          size={28}
          style={styles.stepButton}
        />
        <TextInput
          accessibilityLabel={label}
          style={styles.stepValue}
          value={String(value)}
          keyboardType="number-pad"
          onChangeText={(t) => onChange(parseInt(t, 10) || 0)}
        />
        <IconButton
          icon={<Text style={styles.stepButtonText}>+</Text>}
          onPress={() => onChange(value + step)}
          accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
          variant="tinted"
          size={28}
          style={styles.stepButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  exerciseName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  fieldsRow: { flexDirection: 'row', gap: spacing.sm },
  numberField: { flex: 1, alignItems: 'center', gap: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepButton: { borderRadius: radius.sm },
  stepButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  stepValue: { width: 36, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  moveRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  // Altura minima de 44 para a area de toque ficar confortavel.
  moveButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.background },
  moveButtonDisabled: { opacity: 0.4 },
  moveButtonText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
});
