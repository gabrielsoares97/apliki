/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { thinChartLabels } from '../chartLabels';

describe('thinChartLabels', () => {
  const dates = ['18/09', '19/09', '20/09', '22/09', '25/09', '27/09', '02/10', '12/10', '22/10', '28/10'];

  it('mantém todas as datas quando elas cabem', () => {
    expect(thinChartLabels(['18/09', '19/09', '20/09'])).toEqual(['18/09', '19/09', '20/09']);
    expect(thinChartLabels(dates.slice(0, 4))).toEqual(dates.slice(0, 4));
  });

  it('com 10 datas mostra só 4, em intervalos regulares', () => {
    expect(thinChartLabels(dates)).toEqual(['18/09', '', '', '22/09', '', '', '02/10', '', '', '28/10']);
  });

  it('sempre mostra a primeira e a última data', () => {
    for (let size = 5; size <= 30; size++) {
      const labels = Array.from({ length: size }, (_, i) => `d${i}`);
      const result = thinChartLabels(labels);
      expect(result[0]).toBe('d0');
      expect(result[size - 1]).toBe(`d${size - 1}`);
      expect(result.filter(Boolean)).toHaveLength(4);
    }
  });

  it('não altera a quantidade de pontos', () => {
    expect(thinChartLabels(dates)).toHaveLength(dates.length);
  });
});
