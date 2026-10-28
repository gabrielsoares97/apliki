/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { colors } from './theme';

export interface BmiSegment {
  label: string;
  min: number;
  max: number;
  color: string;
}

/** Escala usada no gráfico do IMC, do "bom" (peso saudável) até "muito ruim" (obesidade grau III). */
export const BMI_SCALE_MIN = 15;
export const BMI_SCALE_MAX = 42;

export const BMI_SEGMENTS: BmiSegment[] = [
  { label: 'Abaixo do peso', min: BMI_SCALE_MIN, max: 18.5, color: '#4FA3D9' },
  { label: 'Peso saudável', min: 18.5, max: 25, color: colors.primary },
  { label: 'Sobrepeso', min: 25, max: 30, color: '#E0C13B' },
  { label: 'Obesidade grau I', min: 30, max: 35, color: '#E0A93B' },
  { label: 'Obesidade grau II', min: 35, max: 40, color: '#E0813B' },
  { label: 'Obesidade grau III', min: 40, max: BMI_SCALE_MAX, color: colors.danger },
];

export function getBmiCategory(bmi: number): BmiSegment {
  for (const segment of BMI_SEGMENTS) {
    if (bmi < segment.max) return segment;
  }
  return BMI_SEGMENTS[BMI_SEGMENTS.length - 1];
}

/** Posição do IMC na escala do gráfico, de 0 a 1 (limitada às bordas). */
export function getBmiScalePosition(bmi: number): number {
  const clamped = Math.min(BMI_SCALE_MAX, Math.max(BMI_SCALE_MIN, bmi));
  return (clamped - BMI_SCALE_MIN) / (BMI_SCALE_MAX - BMI_SCALE_MIN);
}
