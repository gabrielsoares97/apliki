/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { DEFAULT_PLANS, formatBRL, monthlyCents, yearlySavingsPercent } from '../plans';

describe('plans', () => {
  it('formata valores em reais', () => {
    expect(formatBRL(2990)).toBe('R$ 29,90');
    expect(formatBRL(19990)).toBe('R$ 199,90');
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(500)).toBe('R$ 5,00');
  });

  it('calcula o equivalente mensal do plano anual', () => {
    const [mensal, anual] = DEFAULT_PLANS;
    expect(monthlyCents(mensal)).toBe(2990);
    expect(monthlyCents(anual)).toBe(1666);
  });

  it('calcula a economia do anual', () => {
    expect(yearlySavingsPercent(DEFAULT_PLANS)).toBe(44);
    expect(yearlySavingsPercent([DEFAULT_PLANS[0]])).toBe(0);
    // Anual mais caro que 12 mensalidades não vira desconto negativo.
    expect(yearlySavingsPercent([DEFAULT_PLANS[0], { id: 'anual', amount: 50000, interval: 'year' }])).toBe(0);
  });
});
