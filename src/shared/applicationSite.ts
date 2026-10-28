/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { ApplicationSite, DoseLog } from '../types';

const ROTATION: ApplicationSite[] = ['abdomen', 'coxa', 'braco'];

/** Sugere o próximo local de aplicação, revezando entre abdômen/coxa/braço para reduzir o risco de lipodistrofia. */
export function suggestNextApplicationSite(lastDose: DoseLog | null): ApplicationSite | null {
  if (!lastDose?.applicationSite) return null;
  const index = ROTATION.indexOf(lastDose.applicationSite);
  if (index === -1) return null;
  return ROTATION[(index + 1) % ROTATION.length];
}
