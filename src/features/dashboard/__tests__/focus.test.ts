/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { expectedWaterMl, FocusInput, getFocusItems } from '../focus';

function at(hour: number, minute = 0): Date {
  return new Date(2026, 8, 18, hour, minute);
}

const base: FocusInput = {
  now: at(15),
  nextDoseAt: null,
  doseLoggedToday: false,
  waterConsumedMl: 0,
  waterGoalMl: 2000,
  cupSizeMl: 250,
  weightLoggedToday: true,
  mealLoggedToday: true,
};

describe('expectedWaterMl', () => {
  it('e zero antes das 7h e a meta inteira depois das 22h', () => {
    expect(expectedWaterMl(at(5), 2000)).toBe(0);
    expect(expectedWaterMl(at(23), 2000)).toBe(2000);
  });

  it('distribui a meta ao longo do dia', () => {
    // 14h30 = metade entre 7h e 22h
    expect(expectedWaterMl(at(14, 30), 2000)).toBe(1000);
  });
});

describe('getFocusItems', () => {
  it('nao sugere nada quando tudo esta em dia', () => {
    expect(getFocusItems({ ...base, waterConsumedMl: 2000 })).toEqual([]);
  });

  it('prioriza dose atrasada sobre agua e refeicao', () => {
    const items = getFocusItems({
      ...base,
      nextDoseAt: new Date(2026, 8, 16, 9).toISOString(),
      mealLoggedToday: false,
    });
    expect(items.map((i) => i.key)).toEqual(['dose', 'water', 'meal']);
    expect(items[0].title).toMatch(/atrasada/);
  });

  it('conta os dias de atraso pelo calendario, nao por blocos de 24h', () => {
    const lateSubtitle = (nextDoseAt: Date) =>
      getFocusItems({ ...base, waterConsumedMl: 2000, nextDoseAt: nextDoseAt.toISOString() })[0].subtitle;
    // Ontem as 23h: 1 dia (antes virava "0" e caia no minimo de 1).
    expect(lateSubtitle(new Date(2026, 8, 17, 23))).toMatch(/ontem/);
    // Anteontem as 23h: 25h antes do inicio de hoje, mas sao 2 dias de calendario (antes dava 1).
    expect(lateSubtitle(new Date(2026, 8, 16, 23))).toMatch(/2 dias/);
    // Anteontem de manha: continua 2 dias.
    expect(lateSubtitle(new Date(2026, 8, 16, 1))).toMatch(/2 dias/);
    expect(lateSubtitle(new Date(2026, 8, 11, 9))).toMatch(/7 dias/);
  });

  it('sugere a dose no proprio dia dela', () => {
    const items = getFocusItems({ ...base, nextDoseAt: new Date(2026, 8, 18, 20).toISOString(), waterConsumedMl: 2000 });
    expect(items).toHaveLength(1);
    expect(items[0].title).toMatch(/dia da sua dose/);
  });

  it('nao sugere dose ja registrada hoje nem dose de amanha', () => {
    expect(getFocusItems({ ...base, waterConsumedMl: 2000, nextDoseAt: new Date(2026, 8, 16).toISOString(), doseLoggedToday: true })).toEqual([]);
    expect(getFocusItems({ ...base, waterConsumedMl: 2000, nextDoseAt: new Date(2026, 8, 19, 9).toISOString() })).toEqual([]);
  });

  it('so cobra agua quando esta pelo menos um copo abaixo do ritmo', () => {
    // 15h: esperado ~1067ml; com 900ml esta menos de um copo atras
    expect(getFocusItems({ ...base, waterConsumedMl: 900 })).toEqual([]);
    expect(getFocusItems({ ...base, waterConsumedMl: 500 })[0].key).toBe('water');
  });

  it('cobra refeicao so depois das 11h e peso so depois das 18h', () => {
    expect(getFocusItems({ ...base, now: at(9), mealLoggedToday: false, waterConsumedMl: 2000 })).toEqual([]);
    expect(getFocusItems({ ...base, now: at(12), mealLoggedToday: false, waterConsumedMl: 2000 }).map((i) => i.key)).toEqual(['meal']);
    expect(getFocusItems({ ...base, now: at(19), weightLoggedToday: false, waterConsumedMl: 2000 }).map((i) => i.key)).toEqual(['weight']);
  });
});
