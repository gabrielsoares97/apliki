/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { addDays, calendarDaysBetween, dateKeyOfIso, isSameDay, toDateKey } from '../date';

// O Jest roda no fuso do aparelho; os testes valem para qualquer fuso porque comparam com o dia local.
function localKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('toDateKey', () => {
  it('usa o dia local, inclusive perto da meia-noite', () => {
    expect(toDateKey(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
    expect(toDateKey(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
    expect(toDateKey(new Date(2026, 9, 7, 12, 0))).toBe('2026-10-07');
  });

  it('completa mes e dia com zero', () => {
    expect(toDateKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('nao passa por UTC (toISOString troca o dia nos fusos a leste de Greenwich)', () => {
    const spy = jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
      throw new Error('toDateKey nao deve usar UTC');
    });
    try {
      expect(toDateKey(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('dateKeyOfIso', () => {
  it('converte o horario salvo em UTC para o dia local', () => {
    // Perto da meia-noite UTC o dia local difere do prefixo da string em quase todos os fusos.
    for (const iso of ['2026-10-08T02:00:00.000Z', '2026-10-07T23:00:00.000Z', '2026-10-07T12:00:00.000Z']) {
      expect(dateKeyOfIso(iso)).toBe(localKey(new Date(iso)));
    }
  });

  it('um registro feito as 23h locais conta para o proprio dia', () => {
    const lateNight = new Date(2026, 9, 7, 23, 30);
    expect(dateKeyOfIso(lateNight.toISOString())).toBe('2026-10-07');
  });
});

describe('isSameDay', () => {
  it('compara pelo dia local', () => {
    expect(isSameDay(new Date(2026, 0, 1, 0, 10), new Date(2026, 0, 1, 23, 50))).toBe(true);
    expect(isSameDay(new Date(2026, 0, 1, 23, 50), new Date(2026, 0, 2, 0, 10))).toBe(false);
  });
});

describe('calendarDaysBetween', () => {
  it('conta viradas de dia, nao blocos de 24h', () => {
    expect(calendarDaysBetween(new Date(2026, 0, 1, 23, 0), new Date(2026, 0, 2, 1, 0))).toBe(1);
    expect(calendarDaysBetween(new Date(2026, 0, 1, 1, 0), new Date(2026, 0, 1, 23, 0))).toBe(0);
    expect(calendarDaysBetween(new Date(2026, 0, 3), new Date(2026, 0, 1))).toBe(-2);
  });

  it('conta dias inteiros em qualquer epoca do ano (horario de verao incluso)', () => {
    for (let month = 0; month < 12; month++) {
      const start = new Date(2026, month, 1, 12, 0);
      expect(calendarDaysBetween(start, addDays(start, 45))).toBe(45);
    }
  });
});
