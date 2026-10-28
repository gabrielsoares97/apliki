/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { suggestNextApplicationSite } from '../applicationSite';
import { DoseLog } from '../../types';

function dose(applicationSite: DoseLog['applicationSite']): DoseLog {
  return { id: '1', medicationId: 'm', doseMg: 5, applicationSite, dateTime: new Date().toISOString(), notes: null };
}

describe('suggestNextApplicationSite', () => {
  it('retorna null quando não há dose anterior', () => {
    expect(suggestNextApplicationSite(null)).toBeNull();
  });

  it('sugere o próximo local do rodízio abdômen -> coxa -> braço -> abdômen', () => {
    expect(suggestNextApplicationSite(dose('abdomen'))).toBe('coxa');
    expect(suggestNextApplicationSite(dose('coxa'))).toBe('braco');
    expect(suggestNextApplicationSite(dose('braco'))).toBe('abdomen');
  });

  it('retorna null quando o último local não está no rodízio (ex: outro)', () => {
    expect(suggestNextApplicationSite(dose('outro'))).toBeNull();
  });
});
