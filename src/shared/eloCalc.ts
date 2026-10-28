/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export interface EloTier {
  level: number;
  name: string;
  minPoints: number;
  description: string;
  tierGroup: 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lendario';
}

export const ELO_TIERS: EloTier[] = [
  { level: 1, name: 'Iniciante', minPoints: 0, description: 'Está começando, aprendendo os exercícios e criando rotina.', tierGroup: 'bronze' },
  { level: 2, name: 'Recruta', minPoints: 80, description: 'Já treina com alguma frequência e domina o básico.', tierGroup: 'bronze' },
  { level: 3, name: 'Atleta', minPoints: 250, description: 'Começa a ter consistência e evolução perceptível.', tierGroup: 'prata' },
  { level: 4, name: 'Titã', minPoints: 600, description: 'Treina sério, boa força e condicionamento.', tierGroup: 'prata' },
  { level: 5, name: 'Elite', minPoints: 1200, description: 'Alto nível de disciplina e desempenho.', tierGroup: 'ouro' },
  { level: 6, name: 'Monstro', minPoints: 2500, description: 'Performance muito acima da média.', tierGroup: 'diamante' },
  { level: 7, name: 'Lendário', minPoints: 5000, description: 'Nível máximo, extremamente consistente e dedicado.', tierGroup: 'lendario' },
];

export interface HealthPointsInput {
  doseCount: number;
  weightCount: number;
  waterLogCount: number;
  mealCount: number;
  activityCount: number;
  workoutSessionCount: number;
  streak: number;
}

/** Pontuação de engajamento: cada tipo de registro vale um peso diferente (ações mais trabalhosas valem mais), mais um bônus pelo streak atual. */
export function computeHealthPoints(input: HealthPointsInput): number {
  return Math.round(
    input.doseCount * 6 +
      input.weightCount * 4 +
      input.waterLogCount * 1 +
      input.mealCount * 3 +
      input.activityCount * 5 +
      input.workoutSessionCount * 12 +
      input.streak * 4
  );
}

export function getEloTier(points: number): EloTier {
  let current = ELO_TIERS[0];
  for (const tier of ELO_TIERS) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
}

export function getNextTier(currentTier: EloTier): EloTier | null {
  return ELO_TIERS.find((t) => t.level === currentTier.level + 1) ?? null;
}

export interface EloProgress {
  points: number;
  tier: EloTier;
  nextTier: EloTier | null;
  /** 0 a 1: progresso dentro do elo atual em direção ao próximo. */
  progressToNext: number;
  pointsToNext: number | null;
}

export function computeEloProgress(points: number): EloProgress {
  const tier = getEloTier(points);
  const nextTier = getNextTier(tier);
  if (!nextTier) {
    return { points, tier, nextTier: null, progressToNext: 1, pointsToNext: null };
  }
  const range = nextTier.minPoints - tier.minPoints;
  const progressToNext = range > 0 ? Math.min(1, Math.max(0, (points - tier.minPoints) / range)) : 1;
  return { points, tier, nextTier, progressToNext, pointsToNext: Math.max(0, nextTier.minPoints - points) };
}
