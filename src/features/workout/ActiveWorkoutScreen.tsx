/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { PeekCarousel } from '../../shared/components/PeekCarousel';
import { MUSCLE_GROUP_EMOJI } from '../../shared/muscleEmoji';
import { RestTimer } from '../../shared/components/RestTimer';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { workoutSessionRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { useAppStore } from '../../store/useAppStore';
import { Exercise, LoggedExercise, LoggedSet, SetType, TemplateExercise, WorkoutTemplate } from '../../types';
import { getExerciseById } from '../../shared/exerciseCatalog';
import { computeSessionVolume, estimateCalories } from '../../shared/workoutCalc';
import { cancelRestEndNotification, scheduleRestEndNotification } from '../../notifications/notifications';
import { ExercisePickerModal } from './ExercisePickerModal';
import { ExerciseInfoModal } from './ExerciseInfoModal';

interface WorkoutExerciseState {
  exercise: Exercise;
  templateExercise: TemplateExercise;
  sets: LoggedSet[];
}

function buildInitialSets(templateExercise: TemplateExercise): LoggedSet[] {
  return Array.from({ length: templateExercise.sets }, (_, i) => ({
    setNumber: i + 1,
    weightKg: 0,
    reps: templateExercise.reps,
    type: 'normal' as SetType,
    completed: false,
  }));
}

function formatKg(value: number): string {
  return String(value).replace('.', ',');
}

export function ActiveWorkoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const template: WorkoutTemplate | undefined = route.params?.template;
  const generated: { name: string; exercises: TemplateExercise[] } | undefined = route.params?.generated;

  const user = useAppStore((s) => s.user);
  const bump = useAppStore((s) => s.bump);
  const startTimeRef = useRef(new Date());
  const sessionIdRef = useRef(newId());

  const workoutName = template?.name ?? generated?.name ?? 'Treino';
  const initialExercises = template?.exercises ?? generated?.exercises ?? [];

  const [exercises, setExercises] = useState<WorkoutExerciseState[]>(() =>
    initialExercises
      .map((te) => {
        const exercise = getExerciseById(te.exerciseId);
        if (!exercise) return null;
        return { exercise, templateExercise: te, sets: buildInitialSets(te) };
      })
      .filter((e): e is WorkoutExerciseState => e !== null)
  );

  const [restFor, setRestFor] = useState<{ exerciseIndex: number; seconds: number; key: number } | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    return () => {
      cancelRestEndNotification();
    };
  }, []);

  const totalCompletedSets = useMemo(
    () => exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0),
    [exercises]
  );

  function updateSet(exIndex: number, setIndex: number, patch: Partial<LoggedSet>) {
    setExercises((prev) =>
      prev.map((e, i) => (i === exIndex ? { ...e, sets: e.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) } : e))
    );
  }

  /** Registra a serie atual com o peso digitado, repassa o peso para a proxima serie e inicia a pausa. */
  function completeCurrentSet(exIndex: number) {
    const exerciseState = exercises[exIndex];
    const setIndex = exerciseState.sets.findIndex((s) => !s.completed);
    if (setIndex === -1) return;

    const weight = exerciseState.sets[setIndex].weightKg;
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIndex) return e;
        return {
          ...e,
          sets: e.sets.map((s, j) => {
            if (j === setIndex) return { ...s, completed: true };
            if (j === setIndex + 1 && !s.completed && s.weightKg === 0) return { ...s, weightKg: weight };
            return s;
          }),
        };
      })
    );

    const isLastSet = setIndex === exerciseState.sets.length - 1;
    if (isLastSet) {
      setRestFor(null);
      cancelRestEndNotification();
      return;
    }
    const seconds = exerciseState.templateExercise.restSec;
    setRestFor({ exerciseIndex: exIndex, seconds, key: Date.now() });
    scheduleRestEndNotification(seconds);
  }

  function reopenSet(exIndex: number, setIndex: number) {
    updateSet(exIndex, setIndex, { completed: false });
    if (restFor?.exerciseIndex === exIndex) endRest();
  }

  const endRest = useCallback(() => {
    setRestFor(null);
    cancelRestEndNotification();
  }, []);

  // O aviso em segundo plano ja foi disparado quando o timer termina em primeiro plano.
  const handleRestFinish = useCallback(() => setRestFor(null), []);

  function addSet(exIndex: number) {
    setExercises((prev) =>
      prev.map((e, i) => {
        if (i !== exIndex) return e;
        const lastWeight = e.sets[e.sets.length - 1]?.weightKg ?? 0;
        return { ...e, sets: [...e.sets, { setNumber: e.sets.length + 1, weightKg: lastWeight, reps: e.templateExercise.reps, type: 'normal', completed: false }] };
      })
    );
  }

  function handleSwap(newExercise: Exercise) {
    if (swapIndex === null) return;
    setExercises((prev) =>
      prev.map((e, i) =>
        i === swapIndex ? { ...e, exercise: newExercise, templateExercise: { ...e.templateExercise, exerciseId: newExercise.id } } : e
      )
    );
    setSwapIndex(null);
  }

  async function handleFinish() {
    if (finishing) return;
    if (totalCompletedSets === 0) {
      Alert.alert('Nenhuma série registrada', 'Complete ao menos uma série antes de finalizar.');
      return;
    }
    setFinishing(true);
    endRest();
    const durationMin = Math.max(1, Math.round((Date.now() - startTimeRef.current.getTime()) / 60000));
    // Historico guarda apenas o que foi realmente feito.
    const loggedExercises: LoggedExercise[] = exercises
      .map((e) => ({ exerciseId: e.exercise.id, sets: e.sets.filter((s) => s.completed) }))
      .filter((e) => e.sets.length > 0);
    const totalVolumeKg = computeSessionVolume(loggedExercises);
    const caloriesEstimate = estimateCalories(durationMin, user?.currentWeightKg ?? null);

    try {
      // Id fixo da sessao: se a gravacao falhar e a pessoa tentar de novo, nao duplica o treino.
      await workoutSessionRepository.insert(
        {
          templateId: template?.id ?? null,
          name: workoutName,
          dateTime: startTimeRef.current.toISOString(),
          durationMin,
          exercises: loggedExercises,
          totalVolumeKg,
          caloriesEstimate,
        },
        sessionIdRef.current
      );
    } catch {
      // O treino continua na tela (nada se perde): da para tentar de novo quando a conexao voltar.
      // Depois de salvar o botao fica desativado ate sair da tela, por isso so reativa aqui.
      setFinishing(false);
      Alert.alert('Não foi possível salvar o treino', 'Verifique sua conexão com a internet e toque em "Finalizar treino" de novo.');
      return;
    }

    bump();
    Alert.alert(
      'Treino concluído! 💪',
      `Duração: ${durationMin} min\nVolume total: ${totalVolumeKg} kg\nCalorias estimadas: ${caloriesEstimate} kcal\n\nSalvo no seu histórico de progresso.`,
      [{ text: 'OK', onPress: () => navigation.navigate('WorkoutHome') }]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={typography.title}>{workoutName}</Text>
        <Text style={styles.subtitle}>{totalCompletedSets} séries concluídas</Text>

        <View style={styles.carouselHeader}>
          <Text style={styles.carouselCounter}>
            Exercício {Math.min(currentIndex + 1, exercises.length)} de {exercises.length}
          </Text>
          <Text style={styles.carouselHint}>Deslize para o lado ›</Text>
        </View>

        <PeekCarousel peek={0} onIndexChange={setCurrentIndex}>
          {exercises.map((exerciseState, exIndex) => {
            const doneSets = exerciseState.sets.filter((s) => s.completed);
            const currentSetIndex = exerciseState.sets.findIndex((s) => !s.completed);
            const currentSet = currentSetIndex >= 0 ? exerciseState.sets[currentSetIndex] : null;
            const isResting = restFor?.exerciseIndex === exIndex;
            const isLastSet = currentSetIndex === exerciseState.sets.length - 1;

            return (
              <Card key={`${exerciseState.exercise.id}-${exIndex}`}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseThumb}>
                    <Text style={{ fontSize: 22 }}>{MUSCLE_GROUP_EMOJI[exerciseState.exercise.muscleGroup]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName} numberOfLines={2}>{exerciseState.exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {doneSets.length}/{exerciseState.sets.length} séries · meta {exerciseState.templateExercise.reps} reps
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSwapIndex(exIndex)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={`Trocar ${exerciseState.exercise.name}`}
                  >
                    <Text style={styles.swapText}>Trocar</Text>
                  </Pressable>
                  {/* Circulo de 26px; o hitSlop de 9 completa a area de toque ate 44px. */}
                  <Pressable
                    onPress={() => setInfoExercise(exerciseState.exercise)}
                    hitSlop={9}
                    style={styles.infoButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Como executar ${exerciseState.exercise.name}`}
                  >
                    <Text style={styles.infoText}>i</Text>
                  </Pressable>
                </View>

                {isResting && restFor ? (
                  <RestTimer key={restFor.key} seconds={restFor.seconds} onFinish={handleRestFinish} onSkip={endRest} onExtend={scheduleRestEndNotification} />
                ) : currentSet ? (
                  <View>
                    <Text style={styles.setTitle}>Série {currentSet.setNumber} de {exerciseState.sets.length}</Text>
                    <View style={styles.inputRow}>
                      <View style={{ flex: 1.4 }}>
                        <Text style={styles.inputLabel}>Peso (kg)</Text>
                        <TextInput
                          style={styles.weightInput}
                          keyboardType="decimal-pad"
                          value={currentSet.weightKg ? formatKg(currentSet.weightKg) : ''}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          onChangeText={(t) => updateSet(exIndex, currentSetIndex, { weightKg: parseFloat(t.replace(',', '.')) || 0 })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Reps</Text>
                        <TextInput
                          style={styles.weightInput}
                          keyboardType="number-pad"
                          value={currentSet.reps ? String(currentSet.reps) : ''}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          onChangeText={(t) => updateSet(exIndex, currentSetIndex, { reps: parseInt(t, 10) || 0 })}
                        />
                      </View>
                    </View>
                    <Button
                      label={isLastSet ? '✓ Concluir exercício' : `⏱ Iniciar pausa (${exerciseState.templateExercise.restSec}s)`}
                      onPress={() => completeCurrentSet(exIndex)}
                      style={styles.restButton}
                    />
                  </View>
                ) : (
                  <View style={styles.doneBox}>
                    <Text style={styles.doneText}>✓ Exercício concluído</Text>
                    <Pressable onPress={() => addSet(exIndex)} hitSlop={12} accessibilityRole="button">
                      <Text style={styles.addSetText}>+ Série extra</Text>
                    </Pressable>
                  </View>
                )}

                {doneSets.length > 0 && (
                  <View style={styles.doneList}>
                    {exerciseState.sets.map((s, setIndex) =>
                      s.completed ? (
                        <Pressable
                          key={setIndex}
                          style={styles.doneChip}
                          onPress={() => reopenSet(exIndex, setIndex)}
                          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Série ${s.setNumber}: ${formatKg(s.weightKg)} kg, ${s.reps} repetições`}
                          accessibilityHint="Reabre a série para corrigir"
                        >
                          <Text style={styles.doneChipText}>
                            {s.setNumber} · {formatKg(s.weightKg)}kg × {s.reps}
                          </Text>
                        </Pressable>
                      ) : null
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </PeekCarousel>

        <Button label="✓ Finalizar treino" onPress={handleFinish} loading={finishing} style={styles.finishButton} />
      </ScrollView>

      <ExerciseInfoModal exercise={infoExercise} onClose={() => setInfoExercise(null)} />

      <ExercisePickerModal
        visible={swapIndex !== null}
        onClose={() => setSwapIndex(null)}
        onSelect={handleSwap}
        lockedMuscleGroup={swapIndex !== null ? exercises[swapIndex].exercise.muscleGroup : null}
        title="Trocar exercício"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  subtitle: { ...typography.small, marginTop: 2, marginBottom: spacing.sm },
  carouselHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  carouselCounter: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  carouselHint: { ...typography.caption },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginBottom: spacing.md },
  exerciseThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  exerciseMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  infoButton: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.primary, fontWeight: '700', fontSize: 14, fontStyle: 'italic' },
  swapText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  setTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  weightInput: {
    backgroundColor: colors.background,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  restButton: { marginTop: spacing.md },
  doneBox: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  doneText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  addSetText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  doneList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginTop: spacing.md },
  doneChip: { minHeight: 32, justifyContent: 'center', backgroundColor: colors.background, borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: spacing.sm + 2, borderWidth: 1, borderColor: colors.border },
  doneChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  finishButton: { marginTop: spacing.lg },
});
