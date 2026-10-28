/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { calculateNutritionGoals } from '../nutritionCalc';

describe('calculateNutritionGoals', () => {
  it('calcula metas para um perfil típico', () => {
    const result = calculateNutritionGoals({
      sex: 'feminino',
      age: 34,
      heightCm: 165,
      currentWeightKg: 90,
      activityLevel: 'sedentario',
      weeklyPaceGoalKg: 0.5,
    });

    expect(result.calories).toBeGreaterThan(0);
    expect(result.protein).toBeGreaterThan(0);
    expect(result.carb).toBeGreaterThanOrEqual(0);
    expect(result.fat).toBeGreaterThan(0);
    expect(result.fiber).toBeGreaterThan(0);
  });

  it('nunca calcula calorias abaixo do mínimo seguro (1200 kcal)', () => {
    const result = calculateNutritionGoals({
      sex: 'feminino',
      age: 60,
      heightCm: 150,
      currentWeightKg: 50,
      activityLevel: 'sedentario',
      weeklyPaceGoalKg: 1.5,
    });

    expect(result.calories).toBeGreaterThanOrEqual(1200);
  });

  it('aumenta as calorias com maior nível de atividade, mantendo o resto igual', () => {
    const base = { sex: 'masculino' as const, age: 30, heightCm: 180, currentWeightKg: 90, weeklyPaceGoalKg: 0.5 };
    const sedentary = calculateNutritionGoals({ ...base, activityLevel: 'sedentario' });
    const active = calculateNutritionGoals({ ...base, activityLevel: 'muito_ativo' });

    expect(active.calories).toBeGreaterThan(sedentary.calories);
  });

  it('aumenta o déficit calórico (calorias menores) para ritmos mais rápidos', () => {
    const base = { sex: 'masculino' as const, age: 30, heightCm: 180, currentWeightKg: 90, activityLevel: 'moderado' as const };
    const slow = calculateNutritionGoals({ ...base, weeklyPaceGoalKg: 0.25 });
    const fast = calculateNutritionGoals({ ...base, weeklyPaceGoalKg: 1 });

    expect(fast.calories).toBeLessThanOrEqual(slow.calories);
  });
});
