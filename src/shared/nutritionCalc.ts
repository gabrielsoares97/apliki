/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { ActivityLevel, Sex } from '../types';

export const SEX_OPTIONS: Sex[] = ['feminino', 'masculino', 'outro'];
export const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo'];
export const PACE_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5];

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { title: string; subtitle: string }> = {
  sedentario: { title: 'Sedentário', subtitle: 'Pouco ou nenhum exercício' },
  leve: { title: 'Levemente ativo', subtitle: 'Exercício 1–3 dias/semana' },
  moderado: { title: 'Moderadamente ativo', subtitle: 'Exercício 3–4 dias/semana' },
  ativo: { title: 'Ativo', subtitle: 'Exercício 5–6 dias/semana' },
  muito_ativo: { title: 'Muito ativo', subtitle: 'Exercício intenso diário' },
};

export const SEX_LABELS: Record<Sex, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  outro: 'Prefiro não dizer / outro',
};

export interface NutritionGoalsInput {
  sex: Sex | null;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  activityLevel: ActivityLevel | null;
  /** Ritmo desejado de perda de peso, em kg/semana. */
  weeklyPaceGoalKg: number | null;
}

export interface NutritionGoalsResult {
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
}

const KCAL_PER_KG_FAT = 7700;
const MIN_CALORIES = 1200;
const MAX_DAILY_DEFICIT = 1000;

/** Estimativa de metas nutricionais (Mifflin-St Jeor + multiplicador de atividade + déficit pelo ritmo desejado). */
export function calculateNutritionGoals(input: NutritionGoalsInput): NutritionGoalsResult {
  const { sex, age, heightCm, currentWeightKg, activityLevel, weeklyPaceGoalKg } = input;

  const sexOffset = sex === 'masculino' ? 5 : sex === 'feminino' ? -161 : -78;
  const bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age + sexOffset;

  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel ?? 'sedentario'];

  const pace = weeklyPaceGoalKg ?? 0.5;
  const dailyDeficit = Math.min(MAX_DAILY_DEFICIT, (pace * KCAL_PER_KG_FAT) / 7);

  const calories = Math.max(MIN_CALORIES, Math.round(tdee - dailyDeficit));
  const protein = Math.round(currentWeightKg * 1.8);
  const fat = Math.round((calories * 0.28) / 9);
  const proteinAndFatCalories = protein * 4 + fat * 9;
  const carb = Math.max(0, Math.round((calories - proteinAndFatCalories) / 4));
  const fiber = Math.round((calories / 1000) * 14);

  return { calories, protein, carb, fat, fiber };
}
