/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export interface Achievement {
  key: string;
  emoji: string;
  label: string;
  unlocked: boolean;
}

const STREAK_MILESTONES = [7, 30, 100];
const WEIGHT_LOSS_MILESTONES = [2, 5, 10, 15, 20, 30];

/** Calcula conquistas de streak e perda de peso. Retorna todas as desbloqueadas e a próxima meta de cada tipo (bloqueada, para motivar). */
export function computeAchievements(streak: number, startWeightKg: number | null, currentWeightKg: number | null): Achievement[] {
  const achievements: Achievement[] = [];

  const nextStreak = STREAK_MILESTONES.find((m) => m > streak);
  STREAK_MILESTONES.filter((m) => m <= streak || m === nextStreak).forEach((m) => {
    achievements.push({ key: `streak-${m}`, emoji: '🔥', label: `${m} dias seguidos`, unlocked: streak >= m });
  });

  const lostKg = startWeightKg && currentWeightKg ? startWeightKg - currentWeightKg : 0;
  const nextLoss = WEIGHT_LOSS_MILESTONES.find((m) => m > lostKg);
  WEIGHT_LOSS_MILESTONES.filter((m) => m <= lostKg || m === nextLoss).forEach((m) => {
    achievements.push({ key: `loss-${m}`, emoji: '⭐', label: `-${m}kg`, unlocked: lostKg >= m });
  });

  return achievements;
}
