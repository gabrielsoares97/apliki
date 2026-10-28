/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Imagens de execução vindas do free-exercise-db (https://github.com/yuhonas/free-exercise-db),
 * base aberta em domínio público (Unlicense). Cada exercício tem 2 fotos: posição inicial e final.
 * Mapeia o id do nosso catálogo para o id da pasta na base; exercícios sem correspondência
 * exata ficam de fora e mostram só o texto de execução.
 */
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const EXERCISE_IMAGE_IDS: Record<string, string> = {
  'supino-reto-barra': 'Barbell_Bench_Press_-_Medium_Grip',
  'supino-inclinado-halteres': 'Incline_Dumbbell_Press',
  'crucifixo-halteres': 'Dumbbell_Flyes',
  'flexao-de-braco': 'Pushups',
  'crossover-cabo': 'Cable_Crossover',
  'supino-maquina': 'Machine_Bench_Press',
  'puxada-frente-barra': 'Wide-Grip_Lat_Pulldown',
  'remada-curvada-barra': 'Bent_Over_Barbell_Row',
  'remada-unilateral-halter': 'One-Arm_Dumbbell_Row',
  'barra-fixa': 'Pullups',
  'remada-cavalinho': 'T-Bar_Row_with_Handle',
  'levantamento-terra': 'Barbell_Deadlift',
  'puxada-alta-cabo-costas': 'Rope_Straight-Arm_Pulldown',
  'desenvolvimento-halteres': 'Dumbbell_Shoulder_Press',
  'elevacao-lateral': 'Side_Lateral_Raise',
  'elevacao-frontal': 'Front_Dumbbell_Raise',
  'remada-alta-barra': 'Upright_Barbell_Row',
  'crucifixo-invertido': 'Reverse_Flyes',
  'desenvolvimento-maquina': 'Machine_Shoulder_Military_Press',
  'rosca-direta-barra': 'Barbell_Curl',
  'rosca-alternada-halteres': 'Dumbbell_Alternate_Bicep_Curl',
  'rosca-martelo': 'Hammer_Curls',
  'rosca-scott': 'Preacher_Curl',
  'rosca-cabo': 'Standing_Biceps_Cable_Curl',
  'triceps-testa': 'EZ-Bar_Skullcrusher',
  'triceps-corda-cabo': 'Triceps_Pushdown_-_Rope_Attachment',
  'triceps-frances-halter': 'Dumbbell_One-Arm_Triceps_Extension',
  'mergulho-banco': 'Bench_Dips',
  'triceps-coice-halter': 'Tricep_Dumbbell_Kickback',
  'agachamento-livre': 'Barbell_Full_Squat',
  'leg-press': 'Leg_Press',
  'cadeira-extensora': 'Leg_Extensions',
  'afundo-halteres': 'Dumbbell_Lunges',
  'agachamento-bulgaro': 'Split_Squat_with_Dumbbells',
  'agachamento-peso-corporal': 'Bodyweight_Squat',
  'stiff-barra': 'Stiff-Legged_Barbell_Deadlift',
  'mesa-flexora': 'Lying_Leg_Curls',
  'stiff-halteres': 'Stiff-Legged_Dumbbell_Deadlift',
  'elevacao-pelvica': 'Barbell_Hip_Thrust',
  'coice-cabo': 'Glute_Kickback',
  'abducao-maquina': 'Thigh_Abductor',
  'elevacao-pelvica-peso-corporal': 'Butt_Lift_Bridge',
  'panturrilha-em-pe': 'Standing_Calf_Raises',
  'panturrilha-sentado': 'Seated_Calf_Raise',
  'panturrilha-peso-corporal': 'Standing_Calf_Raises',
  'abdominal-supra': 'Crunches',
  'prancha': 'Plank',
  'elevacao-pernas': 'Flat_Bench_Lying_Leg_Raise',
  'abdominal-obliquo': 'Oblique_Crunches_-_On_The_Floor',
  'roda-abdominal': 'Ab_Roller',
  'esteira-caminhada': 'Walking_Treadmill',
  'bicicleta-ergometrica': 'Bicycling_Stationary',
  'pular-corda': 'Rope_Jumping',
  'polichinelo': 'Star_Jump',
  'escalador': 'Mountain_Climbers',
  'kettlebell-swing': 'One-Arm_Kettlebell_Swings',
};

/** URLs das fotos de execução (posição inicial e final) ou lista vazia se não houver. */
export function getExerciseImageUrls(exerciseId: string): string[] {
  const folder = EXERCISE_IMAGE_IDS[exerciseId];
  if (!folder) return [];
  return [0, 1].map((n) => `${IMAGE_BASE_URL}/${folder}/${n}.jpg`);
}
