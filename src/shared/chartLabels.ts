/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Deixa no eixo X só as datas que cabem sem encostar umas nas outras, em intervalos regulares e sempre com a
 * primeira e a última. As demais viram texto vazio: o ponto continua no gráfico, só o rótulo some.
 */
export function thinChartLabels(labels: string[], maxVisible = 4): string[] {
  if (labels.length <= maxVisible) return labels;
  const lastIndex = labels.length - 1;
  const visible = new Set<number>();
  for (let i = 0; i < maxVisible; i++) {
    visible.add(Math.round((i * lastIndex) / (maxVisible - 1)));
  }
  return labels.map((label, index) => (visible.has(index) ? label : ''));
}
