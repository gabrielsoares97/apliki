/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { computeAchievements } from '../achievements';

describe('computeAchievements', () => {
  it('não desbloqueia nada com streak 0 e sem perda de peso', () => {
    const result = computeAchievements(0, 90, 90);
    expect(result.every((a) => !a.unlocked)).toBe(true);
  });

  it('desbloqueia a conquista de 7 dias ao atingir o streak', () => {
    const result = computeAchievements(7, null, null);
    const badge = result.find((a) => a.key === 'streak-7');
    expect(badge?.unlocked).toBe(true);
  });

  it('desbloqueia conquistas de perda de peso com base na diferença entre peso inicial e atual', () => {
    const result = computeAchievements(0, 100, 94);
    expect(result.find((a) => a.key === 'loss-2')?.unlocked).toBe(true);
    expect(result.find((a) => a.key === 'loss-5')?.unlocked).toBe(true);
    expect(result.find((a) => a.key === 'loss-10')?.unlocked).toBe(false);
  });

  it('não quebra quando não há peso inicial ou atual registrado', () => {
    expect(() => computeAchievements(5, null, null)).not.toThrow();
  });
});
