/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { WorkoutProgram } from '../types';

/** Programas prontos e estruturados (splits A/B/C), como alternativa ao plano gerado automaticamente. */
export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'hipertrofia-abc',
    name: 'Hipertrofia ABC',
    goal: 'hipertrofia',
    level: 'intermediario',
    daysPerWeek: 3,
    description: 'Divisão clássica em 3 treinos (A/B/C), focada em ganho de massa muscular com volume moderado a alto.',
    templates: [
      {
        name: 'Treino A — Peito e Tríceps',
        exercises: [
          { exerciseId: 'supino-reto-barra', sets: 4, reps: 10, restSec: 90, notes: null },
          { exerciseId: 'supino-inclinado-halteres', sets: 3, reps: 12, restSec: 75, notes: null },
          { exerciseId: 'crucifixo-halteres', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'triceps-corda-cabo', sets: 4, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'triceps-testa', sets: 3, reps: 10, restSec: 60, notes: null },
        ],
      },
      {
        name: 'Treino B — Costas e Bíceps',
        exercises: [
          { exerciseId: 'puxada-frente-barra', sets: 4, reps: 10, restSec: 90, notes: null },
          { exerciseId: 'remada-curvada-barra', sets: 4, reps: 10, restSec: 90, notes: null },
          { exerciseId: 'remada-unilateral-halter', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'rosca-direta-barra', sets: 4, reps: 10, restSec: 60, notes: null },
          { exerciseId: 'rosca-martelo', sets: 3, reps: 12, restSec: 60, notes: null },
        ],
      },
      {
        name: 'Treino C — Pernas e Ombros',
        exercises: [
          { exerciseId: 'agachamento-livre', sets: 4, reps: 10, restSec: 120, notes: null },
          { exerciseId: 'leg-press', sets: 4, reps: 12, restSec: 90, notes: null },
          { exerciseId: 'stiff-barra', sets: 3, reps: 12, restSec: 90, notes: null },
          { exerciseId: 'desenvolvimento-halteres', sets: 4, reps: 10, restSec: 75, notes: null },
          { exerciseId: 'elevacao-lateral', sets: 3, reps: 15, restSec: 45, notes: null },
        ],
      },
    ],
  },
  {
    id: 'full-body-iniciante',
    name: 'Full Body Iniciante',
    goal: 'hipertrofia',
    level: 'iniciante',
    daysPerWeek: 3,
    description: 'Um único treino de corpo inteiro, repetido 3x na semana — ideal para quem está começando.',
    templates: [
      {
        name: 'Treino Full Body',
        exercises: [
          { exerciseId: 'agachamento-peso-corporal', sets: 3, reps: 15, restSec: 60, notes: null },
          { exerciseId: 'supino-maquina', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'puxada-frente-barra', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'desenvolvimento-maquina', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'abdominal-supra', sets: 3, reps: 15, restSec: 45, notes: null },
        ],
      },
    ],
  },
  {
    id: 'push-pull-legs',
    name: 'Push / Pull / Legs',
    goal: 'forca',
    level: 'avancado',
    daysPerWeek: 5,
    description: 'Divisão por padrão de movimento (empurrar / puxar / pernas) para quem treina com alta frequência.',
    templates: [
      {
        name: 'Push (Peito, Ombro, Tríceps)',
        exercises: [
          { exerciseId: 'supino-reto-barra', sets: 5, reps: 6, restSec: 120, notes: null },
          { exerciseId: 'desenvolvimento-halteres', sets: 4, reps: 8, restSec: 90, notes: null },
          { exerciseId: 'crossover-cabo', sets: 3, reps: 12, restSec: 60, notes: null },
          { exerciseId: 'triceps-frances-halter', sets: 4, reps: 10, restSec: 60, notes: null },
        ],
      },
      {
        name: 'Pull (Costas, Bíceps)',
        exercises: [
          { exerciseId: 'levantamento-terra', sets: 4, reps: 6, restSec: 150, notes: null },
          { exerciseId: 'barra-fixa', sets: 4, reps: 8, restSec: 90, notes: null },
          { exerciseId: 'remada-cavalinho', sets: 4, reps: 10, restSec: 90, notes: null },
          { exerciseId: 'rosca-scott', sets: 3, reps: 10, restSec: 60, notes: null },
        ],
      },
      {
        name: 'Legs (Pernas)',
        exercises: [
          { exerciseId: 'agachamento-livre', sets: 5, reps: 6, restSec: 150, notes: null },
          { exerciseId: 'stiff-barra', sets: 4, reps: 8, restSec: 90, notes: null },
          { exerciseId: 'leg-press', sets: 4, reps: 10, restSec: 90, notes: null },
          { exerciseId: 'panturrilha-em-pe', sets: 4, reps: 15, restSec: 45, notes: null },
        ],
      },
    ],
  },
  {
    id: 'emagrecimento-em-casa',
    name: 'Emagrecimento em casa',
    goal: 'emagrecimento',
    level: 'iniciante',
    daysPerWeek: 4,
    description: 'Treinos funcionais sem equipamento, combinando força e cardio para queima calórica — pode ser feito em casa.',
    templates: [
      {
        name: 'Treino 1 — Corpo todo',
        exercises: [
          { exerciseId: 'agachamento-peso-corporal', sets: 3, reps: 20, restSec: 30, notes: null },
          { exerciseId: 'flexao-de-braco', sets: 3, reps: 15, restSec: 30, notes: null },
          { exerciseId: 'burpee', sets: 3, reps: 12, restSec: 45, notes: null },
          { exerciseId: 'prancha', sets: 3, reps: 1, restSec: 30, notes: 'Segurar 30-45 segundos' },
        ],
      },
      {
        name: 'Treino 2 — Cardio e core',
        exercises: [
          { exerciseId: 'polichinelo', sets: 4, reps: 30, restSec: 30, notes: null },
          { exerciseId: 'escalador', sets: 4, reps: 20, restSec: 30, notes: null },
          { exerciseId: 'elevacao-pernas', sets: 3, reps: 15, restSec: 30, notes: null },
          { exerciseId: 'abdominal-obliquo', sets: 3, reps: 20, restSec: 30, notes: null },
        ],
      },
    ],
  },
];

export function getProgramById(id: string): WorkoutProgram | undefined {
  return WORKOUT_PROGRAMS.find((p) => p.id === id);
}
