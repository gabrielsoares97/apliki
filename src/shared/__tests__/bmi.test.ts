/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { getBmiCategory, getBmiScalePosition } from '../bmi';

describe('getBmiCategory', () => {
  it('classifica peso saudável', () => {
    expect(getBmiCategory(22).label).toBe('Peso saudável');
  });

  it('classifica abaixo do peso', () => {
    expect(getBmiCategory(17).label).toBe('Abaixo do peso');
  });

  it('classifica sobrepeso', () => {
    expect(getBmiCategory(27).label).toBe('Sobrepeso');
  });

  it('classifica obesidade grau I', () => {
    expect(getBmiCategory(32).label).toBe('Obesidade grau I');
  });

  it('classifica obesidade grau III para valores muito altos', () => {
    expect(getBmiCategory(45).label).toBe('Obesidade grau III');
  });
});

describe('getBmiScalePosition', () => {
  it('retorna 0 no limite inferior da escala', () => {
    expect(getBmiScalePosition(15)).toBe(0);
  });

  it('retorna 1 no limite superior da escala', () => {
    expect(getBmiScalePosition(42)).toBe(1);
  });

  it('limita valores fora da escala (clamp)', () => {
    expect(getBmiScalePosition(5)).toBe(0);
    expect(getBmiScalePosition(100)).toBe(1);
  });

  it('retorna posição proporcional no meio da escala', () => {
    expect(getBmiScalePosition(28.5)).toBeCloseTo(0.5, 2);
  });
});
