/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import {
  EquipmentType,
  Exercise,
  LoggedExercise,
  MuscleGroup,
  MuscleRecoveryStatus,
  TemplateExercise,
  WorkoutGoal,
  WorkoutLevel,
  WorkoutSession,
  WorkoutTemplate,
} from '../types';
import { EXERCISE_CATALOG } from './exerciseCatalog';
import { calendarDaysBetween } from './date';

const MAIN_MUSCLE_GROUPS: MuscleGroup[] = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
  'abdomen',
];

/** Gera exercícios para um treino rápido a partir dos grupos musculares e do tempo disponível (~6min por exercício, incluindo descanso). */
export function generateQuickWorkout(muscleGroups: MuscleGroup[], minutesAvailable: number): TemplateExercise[] {
  const exerciseCount = Math.max(2, Math.min(8, Math.round(minutesAvailable / 6)));
  const pool = EXERCISE_CATALOG.filter((e) => muscleGroups.includes(e.muscleGroup));
  const perGroup = Math.max(1, Math.ceil(exerciseCount / Math.max(1, muscleGroups.length)));

  const picked: Exercise[] = [];
  for (const group of muscleGroups) {
    const groupExercises = pool.filter((e) => e.muscleGroup === group).slice(0, perGroup);
    picked.push(...groupExercises);
  }

  return picked.slice(0, exerciseCount).map((e) => ({
    exerciseId: e.id,
    sets: 3,
    reps: e.muscleGroup === 'cardio' ? 1 : 12,
    restSec: 60,
    notes: null,
  }));
}

/** Volume total = soma de peso x repetições de todas as séries marcadas como concluídas. */
export function computeSessionVolume(exercises: LoggedExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed) total += set.weightKg * set.reps;
    }
  }
  return Math.round(total);
}

/** Estimativa grosseira de calorias gastas em musculação (MET ~6) com base no peso corporal e na duração. */
export function estimateCalories(durationMin: number, bodyWeightKg: number | null): number {
  const weight = bodyWeightKg ?? 75;
  const met = 6;
  return Math.round((met * 3.5 * weight) / 200 * durationMin);
}

export interface MuscleRecoveryInfo {
  muscleGroup: MuscleGroup;
  daysSinceTrained: number | null;
  status: MuscleRecoveryStatus;
}

/**
 * Para cada grupo muscular principal, calcula há quantos dias (de calendário) foi treinado e um status simples
 * de recuperação (janela de ~72h): hoje = fadigado ("Treinado hoje"), 1–2 dias = recuperando, 3+ = descansado.
 */
export function computeMuscleRecovery(sessions: WorkoutSession[], now: Date = new Date()): MuscleRecoveryInfo[] {
  const lastTrained: Partial<Record<MuscleGroup, number>> = {};

  for (const session of sessions) {
    const sessionDate = new Date(session.dateTime).getTime();
    for (const loggedExercise of session.exercises) {
      const exercise = EXERCISE_CATALOG.find((e) => e.id === loggedExercise.exerciseId);
      if (!exercise) continue;
      const groups = [exercise.muscleGroup, ...exercise.secondaryMuscles];
      for (const group of groups) {
        if (!lastTrained[group] || sessionDate > lastTrained[group]!) lastTrained[group] = sessionDate;
      }
    }
  }

  return MAIN_MUSCLE_GROUPS.map((muscleGroup) => {
    const lastMs = lastTrained[muscleGroup];
    if (!lastMs) return { muscleGroup, daysSinceTrained: null, status: 'descansado' as MuscleRecoveryStatus };
    // Dias de calendario: treino de ontem as 23h ja nao e "Treinado hoje" a 1h da manha.
    const daysSinceTrained = Math.max(0, calendarDaysBetween(new Date(lastMs), now));
    const status: MuscleRecoveryStatus = daysSinceTrained === 0 ? 'fadigado' : daysSinceTrained < 3 ? 'recuperando' : 'descansado';
    return { muscleGroup, daysSinceTrained, status };
  });
}

interface SmartPlanInput {
  goal: WorkoutGoal;
  level: WorkoutLevel;
  daysPerWeek: number;
  equipment: EquipmentType[];
}

const SPLIT_BY_DAYS: Record<number, MuscleGroup[][]> = {
  1: [['peito', 'costas', 'ombros', 'quadriceps', 'abdomen']],
  2: [
    ['peito', 'ombros', 'triceps', 'quadriceps'],
    ['costas', 'biceps', 'posterior', 'gluteos', 'abdomen'],
  ],
  3: [
    ['peito', 'ombros', 'triceps'],
    ['costas', 'biceps', 'abdomen'],
    ['quadriceps', 'posterior', 'gluteos', 'panturrilha'],
  ],
  4: [
    ['peito', 'triceps'],
    ['costas', 'biceps'],
    ['ombros', 'abdomen'],
    ['quadriceps', 'posterior', 'gluteos', 'panturrilha'],
  ],
  5: [
    ['peito'],
    ['costas'],
    ['ombros', 'abdomen'],
    ['quadriceps', 'gluteos'],
    ['posterior', 'panturrilha', 'biceps', 'triceps'],
  ],
};

/**
 * Gera um plano automático (baseado em regras, não em um modelo de IA) de acordo com objetivo, nível,
 * dias disponíveis por semana e equipamentos que a pessoa tem acesso — mesma lógica de "calculadora
 * inteligente" já usada nas metas de nutrição do app.
 */
export function generateSmartPlan(input: SmartPlanInput): { name: string; exercises: TemplateExercise[] }[] {
  const days = Math.max(1, Math.min(5, input.daysPerWeek));
  const split = SPLIT_BY_DAYS[days] ?? SPLIT_BY_DAYS[3];

  const reps = input.goal === 'forca' ? 6 : input.goal === 'resistencia' || input.goal === 'emagrecimento' ? 15 : 10;
  const sets = input.level === 'iniciante' ? 3 : input.level === 'intermediario' ? 4 : 5;
  const restSec = input.goal === 'forca' ? 120 : input.goal === 'resistencia' ? 45 : 75;
  const exercisesPerGroup = input.level === 'iniciante' ? 1 : 2;

  const availableEquipment = input.equipment.length > 0 ? input.equipment : ['peso_corporal', 'halteres', 'maquina', 'cabo', 'barra'];

  return (
    split
      .map((groups) => {
        const exercises: TemplateExercise[] = [];
        for (const group of groups) {
          const options = EXERCISE_CATALOG.filter((e) => e.muscleGroup === group && availableEquipment.includes(e.equipment));
          const chosen = options.slice(0, exercisesPerGroup);
          for (const exercise of chosen) {
            exercises.push({ exerciseId: exercise.id, sets, reps, restSec, notes: null });
          }
        }
        return exercises;
      })
      // Com pouco equipamento um dia pode ficar sem nenhum exercicio: ele sai do plano em vez de virar treino vazio.
      .filter((exercises) => exercises.length > 0)
      .map((exercises, index) => ({ name: `Treino ${String.fromCharCode(65 + index)}`, exercises }))
  );
}

export function totalTemplateSets(template: WorkoutTemplate): number {
  return template.exercises.reduce((sum, e) => sum + e.sets, 0);
}
