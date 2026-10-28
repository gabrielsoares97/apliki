/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export type ApplicationSite = 'abdomen' | 'coxa' | 'braco' | 'outro';

export type Sex = 'feminino' | 'masculino' | 'outro';

export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'ativo' | 'muito_ativo';

export type TreatmentStage = 'aplicando' | 'nao_comecei';

export interface User {
  id: string;
  name: string;
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
  currentWeightKg: number | null;
  goalWeightKg: number | null;
  sex: Sex | null;
  activityLevel: ActivityLevel | null;
  treatmentStage: TreatmentStage | null;
  weeklyPaceGoalKg: number | null;
  motivations: string[];
  dailyWaterGoalMl: number;
  cupSizeMl: number;
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbGoal: number;
  dailyFatGoal: number;
  dailyFiberGoal: number;
  notifyDose: boolean;
  notifyWater: boolean;
  notifyMeal: boolean;
  notifyActivity: boolean;
  dashboardOrder: string; // JSON stringified array of card ids
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  nutritionGoalsSet: boolean;
}

export interface Medication {
  id: string;
  name: string;
  defaultDoseMg: number;
  frequencyDays: number;
  preferredReminderTime: string; // "HH:mm"
  nextDoseAt: string; // ISO datetime
  dosesPerPen: number | null;
  penDosesRemaining: number | null;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  doseMg: number;
  applicationSite: ApplicationSite | null;
  dateTime: string; // ISO
  notes: string | null;
}

export type PhotoAngle = 'front' | 'side' | 'back';

export interface WeightLog {
  id: string;
  weightKg: number;
  dateTime: string;
  photoFrontUri: string | null;
  photoSideUri: string | null;
  photoBackUri: string | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
}

export interface WaterLog {
  id: string;
  amountMl: number;
  dateTime: string;
}

export type MealCategory = 'cafe' | 'almoco' | 'jantar' | 'lanche';

export interface MealLog {
  id: string;
  category: MealCategory;
  name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  dateTime: string;
  isFavorite: boolean;
}

export interface ActivityLog {
  id: string;
  type: string;
  durationMin: number;
  calories: number;
  dateTime: string;
}

export type ReminderType = 'supplement' | 'med' | 'water' | 'meal';

export interface Reminder {
  id: string;
  type: ReminderType;
  name: string;
  times: string[]; // ["HH:mm"]
  daysOfWeek: number[]; // 0=domingo ... 6=sabado
  skippedDates: string[]; // ["YYYY-MM-DD"]
  active: boolean;
  /** Modo "a cada X minutos": `times` guarda os horarios gerados a partir desta janela. */
  intervalMinutes?: number | null;
  windowStart?: string | null; // "HH:mm"
  windowEnd?: string | null; // "HH:mm"
}

export type SymptomTag = 'nausea' | 'fadiga' | 'dor_de_cabeca' | 'constipacao' | 'outro';

export interface SymptomLog {
  id: string;
  tags: SymptomTag[];
  notes: string | null;
  dateTime: string;
}

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilha'
  | 'abdomen'
  | 'cardio'
  | 'corpo_todo';

export type EquipmentType = 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso_corporal' | 'kettlebell' | 'elastico' | 'nenhum';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  instructions: string;
  tip: string;
}

export type SetType = 'aquecimento' | 'normal' | 'dropset' | 'superset';

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
  notes: string | null;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  type: SetType;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  templateId: string | null;
  name: string;
  dateTime: string;
  durationMin: number;
  exercises: LoggedExercise[];
  totalVolumeKg: number;
  caloriesEstimate: number;
}

export type WorkoutGoal = 'hipertrofia' | 'emagrecimento' | 'forca' | 'resistencia';
export type WorkoutLevel = 'iniciante' | 'intermediario' | 'avancado';

export interface WorkoutProgramTemplate {
  name: string;
  exercises: TemplateExercise[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  goal: WorkoutGoal;
  level: WorkoutLevel;
  daysPerWeek: number;
  description: string;
  templates: WorkoutProgramTemplate[];
}

export type MuscleRecoveryStatus = 'descansado' | 'recuperando' | 'fadigado';

export type DashboardCardId = 'nextDose' | 'weight' | 'water' | 'nutrition' | 'activity';

export type TodayEntryKind = 'dose' | 'weight' | 'water' | 'meal' | 'activity';

export type TodayEntryRaw = DoseLog | WeightLog | WaterLog | MealLog | ActivityLog;

export interface TodayEntry {
  id: string;
  kind: TodayEntryKind;
  title: string;
  subtitle: string;
  dateTime: string;
  raw: TodayEntryRaw;
}
