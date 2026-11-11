/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { dotToComma, formatCm, formatDecimal, formatDecimalInput, formatKg, formatMg } from '../format';

describe('formatDecimal', () => {
  it('usa vírgula como separador decimal', () => {
    expect(formatDecimal(83.4)).toBe('83,4');
    expect(formatDecimal(0.5)).toBe('0,5');
  });

  it('não mostra zeros sobrando', () => {
    expect(formatDecimal(83)).toBe('83');
    expect(formatDecimal(83.0)).toBe('83');
    expect(formatDecimal(100)).toBe('100');
    expect(formatDecimal(120.5, 2)).toBe('120,5');
    expect(formatDecimal(7.1, 3)).toBe('7,1');
  });

  it('arredonda para o máximo de casas pedido', () => {
    expect(formatDecimal(83.46)).toBe('83,5');
    expect(formatDecimal(83.44)).toBe('83,4');
    expect(formatDecimal(27.3456, 2)).toBe('27,35');
    expect(formatDecimal(83.96)).toBe('84');
    expect(formatDecimal(83.6, 0)).toBe('84');
  });

  it('limpa restos de conta com ponto flutuante', () => {
    expect(formatDecimal(83.4 - 80)).toBe('3,4');
    expect(formatDecimal(0.1 + 0.2, 2)).toBe('0,3');
  });

  it('mantém o sinal de valores negativos, mas nunca mostra "-0"', () => {
    expect(formatDecimal(-2.5)).toBe('-2,5');
    expect(formatDecimal(-0.01)).toBe('0');
    expect(formatDecimal(0)).toBe('0');
  });

  it('mostra um traço quando o valor não é um número', () => {
    expect(formatDecimal(NaN)).toBe('—');
    expect(formatDecimal(Infinity)).toBe('—');
  });
});

describe('unidades', () => {
  it('formatKg', () => {
    expect(formatKg(83.4)).toBe('83,4 kg');
    expect(formatKg(111)).toBe('111 kg');
    expect(formatKg(83.45)).toBe('83,45 kg');
    expect(formatKg(3.4000000000000057, 1)).toBe('3,4 kg');
  });

  it('formatCm', () => {
    expect(formatCm(165)).toBe('165 cm');
    expect(formatCm(92.5)).toBe('92,5 cm');
  });

  it('formatMg mantém doses fracionadas pequenas', () => {
    expect(formatMg(0.5)).toBe('0,5 mg');
    expect(formatMg(0.25)).toBe('0,25 mg');
    expect(formatMg(2.5)).toBe('2,5 mg');
    expect(formatMg(15)).toBe('15 mg');
  });
});

describe('formatDecimalInput', () => {
  it('não arredonda o valor guardado', () => {
    expect(formatDecimalInput(84.65)).toBe('84,65');
    expect(formatDecimalInput(84)).toBe('84');
    expect(formatDecimalInput(0.25)).toBe('0,25');
  });

  it('gera um texto que a leitura dos campos entende de volta', () => {
    const text = formatDecimalInput(84.6);
    expect(parseFloat(text.replace(',', '.'))).toBe(84.6);
  });
});

describe('dotToComma', () => {
  it('troca o ponto de rótulos numéricos prontos', () => {
    expect(dotToComma('83.0')).toBe('83,0');
    expect(dotToComma('120')).toBe('120');
  });
});
