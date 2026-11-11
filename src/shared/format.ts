/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Formatação de números para EXIBIR em pt-BR (vírgula decimal). A leitura dos campos continua aceitando
 * vírgula ou ponto, e o que é salvo, calculado ou exportado em CSV segue como número com ponto.
 */

/** Troca o ponto decimal de um texto numérico já pronto (ex.: rótulo do eixo de um gráfico): "83.4" -> "83,4". */
export function dotToComma(text: string): string {
  return text.replace('.', ',');
}

/**
 * Número com vírgula decimal, arredondado para no máximo `maxFractionDigits` casas e sem zeros sobrando:
 * 83.4 -> "83,4", 83 -> "83" (nunca "83,0").
 */
export function formatDecimal(value: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = value.toFixed(Math.max(0, maxFractionDigits));
  const trimmed = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
  // Um valor minúsculo negativo arredonda para "-0": mostra só "0".
  return dotToComma(Number(trimmed) === 0 ? '0' : trimmed);
}

/**
 * Valor guardado -> texto inicial de um campo de formulário, sem arredondar: 84.65 -> "84,65".
 * Só para campos cuja leitura aceita vírgula (`parseFloat(texto.replace(',', '.'))`).
 */
export function formatDecimalInput(value: number): string {
  return dotToComma(String(value));
}

/** Peso: 83.4 -> "83,4 kg". Até 2 casas por padrão, para não esconder o que a pessoa digitou (ex.: 83,45). */
export function formatKg(value: number, maxFractionDigits = 2): string {
  return `${formatDecimal(value, maxFractionDigits)} kg`;
}

/** Medidas e altura: 92.5 -> "92,5 cm". */
export function formatCm(value: number, maxFractionDigits = 2): string {
  return `${formatDecimal(value, maxFractionDigits)} cm`;
}

/** Dose: 0.25 -> "0,25 mg". Até 3 casas, porque há doses fracionadas pequenas. */
export function formatMg(value: number, maxFractionDigits = 3): string {
  return `${formatDecimal(value, maxFractionDigits)} mg`;
}
