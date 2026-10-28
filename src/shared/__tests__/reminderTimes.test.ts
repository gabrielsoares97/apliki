/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { countScheduledNotifications, formatInterval, generateIntervalTimes } from '../reminderTimes';

describe('generateIntervalTimes', () => {
  it('gera horarios a cada hora incluindo o ultimo', () => {
    expect(generateIntervalTimes('08:00', '12:00', 60)).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00']);
  });

  it('nao passa do fim da janela', () => {
    expect(generateIntervalTimes('08:00', '10:00', 45)).toEqual(['08:00', '08:45', '09:30']);
  });

  it('aceita intervalos que nao sao divisores da hora', () => {
    expect(generateIntervalTimes('09:00', '12:00', 90)).toEqual(['09:00', '10:30', '12:00']);
  });

  it('retorna vazio para dados invalidos', () => {
    expect(generateIntervalTimes('12:00', '08:00', 60)).toEqual([]);
    expect(generateIntervalTimes('08:00', '20:00', 10)).toEqual([]);
    expect(generateIntervalTimes('08:00', '20:00', NaN)).toEqual([]);
  });

  it('com inicio igual ao fim gera um unico horario', () => {
    expect(generateIntervalTimes('10:00', '10:00', 30)).toEqual(['10:00']);
  });
});

describe('countScheduledNotifications', () => {
  it('todos os dias usa uma notificacao por horario', () => {
    expect(countScheduledNotifications(15, 7)).toBe(15);
  });

  it('dias selecionados multiplica horarios por dias', () => {
    expect(countScheduledNotifications(15, 5)).toBe(75);
  });
});

describe('formatInterval', () => {
  it('formata minutos e horas', () => {
    expect(formatInterval(45)).toBe('45 min');
    expect(formatInterval(60)).toBe('1h');
    expect(formatInterval(90)).toBe('1h30');
    expect(formatInterval(120)).toBe('2h');
  });
});
