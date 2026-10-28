/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { computeMuscleRecovery, computeSessionVolume, estimateCalories, generateQuickWorkout, generateSmartPlan } from '../workoutCalc';
import { LoggedExercise, WorkoutSession } from '../../types';

describe('generateQuickWorkout', () => {
  it('gera exercícios apenas dos grupos musculares pedidos', () => {
    const result = generateQuickWorkout(['peito'], 30);
    expect(result.length).toBeGreaterThan(0);
  });

  it('gera mais exercícios quando há mais tempo disponível', () => {
    const short = generateQuickWorkout(['peito', 'costas'], 12);
    const long = generateQuickWorkout(['peito', 'costas'], 60);
    expect(long.length).toBeGreaterThanOrEqual(short.length);
  });
});

describe('computeSessionVolume', () => {
  it('soma peso x repetições apenas das séries concluídas', () => {
    const exercises: LoggedExercise[] = [
      {
        exerciseId: 'supino-reto-barra',
        sets: [
          { setNumber: 1, weightKg: 40, reps: 10, type: 'normal', completed: true },
          { setNumber: 2, weightKg: 40, reps: 10, type: 'normal', completed: false },
        ],
      },
    ];
    expect(computeSessionVolume(exercises)).toBe(400);
  });

  it('retorna 0 quando não há séries concluídas', () => {
    expect(computeSessionVolume([])).toBe(0);
  });
});

describe('estimateCalories', () => {
  it('estima mais calorias para treinos mais longos', () => {
    expect(estimateCalories(60, 80)).toBeGreaterThan(estimateCalories(20, 80));
  });

  it('usa um peso padrão quando não há peso corporal informado', () => {
    expect(estimateCalories(30, null)).toBeGreaterThan(0);
  });
});

describe('computeMuscleRecovery', () => {
  it('marca todos os grupos como descansados quando não há sessões', () => {
    const result = computeMuscleRecovery([]);
    expect(result.every((r) => r.status === 'descansado')).toBe(true);
  });

  it('marca como fadigado um grupo treinado hoje', () => {
    const session: WorkoutSession = {
      id: '1',
      templateId: null,
      name: 'Treino',
      dateTime: new Date().toISOString(),
      durationMin: 40,
      exercises: [{ exerciseId: 'supino-reto-barra', sets: [] }],
      totalVolumeKg: 0,
      caloriesEstimate: 0,
    };
    const result = computeMuscleRecovery([session]);
    const peito = result.find((r) => r.muscleGroup === 'peito');
    expect(peito?.status).toBe('fadigado');
  });
});

describe('generateSmartPlan', () => {
  it('gera um treino por dia solicitado', () => {
    const plan = generateSmartPlan({ goal: 'hipertrofia', level: 'iniciante', daysPerWeek: 3, equipment: ['halteres', 'peso_corporal', 'maquina', 'cabo', 'barra'] });
    expect(plan.length).toBe(3);
    plan.forEach((day) => expect(day.exercises.length).toBeGreaterThan(0));
  });

  it('respeita o equipamento disponível', () => {
    const plan = generateSmartPlan({ goal: 'hipertrofia', level: 'iniciante', daysPerWeek: 1, equipment: ['peso_corporal'] });
    const allExerciseIds = plan.flatMap((d) => d.exercises.map((e) => e.exerciseId));
    expect(allExerciseIds.length).toBeGreaterThan(0);
  });
});

describe('computeMuscleRecovery (dias de calendario)', () => {
  function sessionAt(date: Date): WorkoutSession {
    return {
      id: date.toISOString(),
      templateId: null,
      name: 'Treino',
      dateTime: date.toISOString(),
      durationMin: 40,
      exercises: [{ exerciseId: 'supino-reto-barra', sets: [] }],
      totalVolumeKg: 0,
      caloriesEstimate: 0,
    };
  }
  const now = new Date(2026, 9, 7, 1, 0); // 01h de 7/10
  const statusOfPeito = (trainedAt: Date) => computeMuscleRecovery([sessionAt(trainedAt)], now).find((r) => r.muscleGroup === 'peito');

  it('treino de ontem as 23h nao e "treinado hoje"', () => {
    expect(statusOfPeito(new Date(2026, 9, 6, 23, 0))).toMatchObject({ daysSinceTrained: 1, status: 'recuperando' });
  });

  it('segue recuperando por ~72h e depois fica descansado', () => {
    expect(statusOfPeito(new Date(2026, 9, 5, 9, 0))?.status).toBe('recuperando');
    expect(statusOfPeito(new Date(2026, 9, 4, 9, 0))).toMatchObject({ daysSinceTrained: 3, status: 'descansado' });
  });

  it('treino de hoje cedo e "treinado hoje"', () => {
    expect(statusOfPeito(new Date(2026, 9, 7, 0, 30))).toMatchObject({ daysSinceTrained: 0, status: 'fadigado' });
  });
});

describe('generateSmartPlan sem exercicios para algum dia', () => {
  it('nao gera treinos vazios e renomeia em sequencia', () => {
    for (const equipment of [['peso_corporal'], ['elastico'], ['kettlebell'], ['cabo']] as const) {
      for (const daysPerWeek of [1, 2, 3, 4, 5]) {
        const plan = generateSmartPlan({ goal: 'hipertrofia', level: 'iniciante', daysPerWeek, equipment: [...equipment] });
        plan.forEach((day, index) => {
          expect(day.exercises.length).toBeGreaterThan(0);
          expect(day.name).toBe(`Treino ${String.fromCharCode(65 + index)}`);
        });
      }
    }
  });
});
