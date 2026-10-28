/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { computeEloProgress, computeHealthPoints, ELO_TIERS, getEloTier, getNextTier } from '../eloCalc';

const ZERO_INPUT = { doseCount: 0, weightCount: 0, waterLogCount: 0, mealCount: 0, activityCount: 0, workoutSessionCount: 0, streak: 0 };

describe('computeHealthPoints', () => {
  it('retorna 0 sem nenhum registro', () => {
    expect(computeHealthPoints(ZERO_INPUT)).toBe(0);
  });

  it('soma pesos diferentes por tipo de registro', () => {
    const points = computeHealthPoints({ ...ZERO_INPUT, doseCount: 1, workoutSessionCount: 1 });
    expect(points).toBe(6 + 12);
  });

  it('inclui o bônus de streak', () => {
    const points = computeHealthPoints({ ...ZERO_INPUT, streak: 10 });
    expect(points).toBe(40);
  });
});

describe('getEloTier', () => {
  it('retorna Iniciante com 0 pontos', () => {
    expect(getEloTier(0).name).toBe('Iniciante');
  });

  it('retorna o elo mais alto compatível com a pontuação', () => {
    expect(getEloTier(300).name).toBe('Atleta');
    expect(getEloTier(5000).name).toBe('Lendário');
    expect(getEloTier(999999).name).toBe('Lendário');
  });

  it('nunca fica abaixo do primeiro elo', () => {
    expect(getEloTier(-100).name).toBe('Iniciante');
  });
});

describe('getNextTier', () => {
  it('retorna o proximo elo da lista', () => {
    expect(getNextTier(ELO_TIERS[0])?.name).toBe('Recruta');
  });

  it('retorna null para o ultimo elo (Lendario)', () => {
    expect(getNextTier(ELO_TIERS[ELO_TIERS.length - 1])).toBeNull();
  });
});

describe('computeEloProgress', () => {
  it('calcula progresso parcial dentro do elo atual', () => {
    const progress = computeEloProgress(40); // metade do caminho entre Iniciante (0) e Recruta (80)
    expect(progress.tier.name).toBe('Iniciante');
    expect(progress.nextTier?.name).toBe('Recruta');
    expect(progress.progressToNext).toBeCloseTo(0.5, 1);
    expect(progress.pointsToNext).toBe(40);
  });

  it('marca progresso completo (1) no elo maximo', () => {
    const progress = computeEloProgress(10000);
    expect(progress.tier.name).toBe('Lendário');
    expect(progress.nextTier).toBeNull();
    expect(progress.progressToNext).toBe(1);
    expect(progress.pointsToNext).toBeNull();
  });
});
