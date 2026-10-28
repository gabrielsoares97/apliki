/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { doseRepository } from '../../db/repositories';
import { getCurrentMedication, updateMedication } from '../../db/repositories/medicationRepository';
import { getUser } from '../../db/repositories/userRepository';
import { scheduleDoseReminder } from '../../notifications/notifications';
import { medicationPatchFromLatestDose } from '../../shared/reminderPlan';
import { useAppStore } from '../../store/useAppStore';
import { Medication } from '../../types';

/**
 * Depois de qualquer insercao, edicao ou exclusao de dose, recalcula o medicamento a partir do historico:
 * a proxima dose sai da dose mais recente (por data, nao pela ordem em que foi registrada) e a caneta
 * ganha/perde a dose informada em `penDelta` (-1 ao registrar, +1 ao apagar, 0 ao editar).
 * Assim registrar uma dose antiga, mudar a data de uma dose ou apagar a ultima nao deixa a data errada.
 *
 * Usado tambem pelos botoes das notificacoes (app fechado), entao depende so dos repositorios.
 * Retorna o medicamento atualizado, ou null se nao ha medicamento cadastrado.
 */
export async function syncMedicationWithDoses(penDelta: number = 0): Promise<Medication | null> {
  const medication = await getCurrentMedication();
  if (!medication) return null;

  const doses = await doseRepository.listAll(); // mais recente primeiro
  const patch = medicationPatchFromLatestDose(medication, doses[0] ?? null, penDelta);
  const updated: Medication = { ...medication, ...patch };
  await updateMedication(medication.id, patch);

  // Com o app fechado (botao da notificacao) o store ainda nao tem o perfil carregado.
  const user = useAppStore.getState().user ?? (await getUser().catch(() => null));
  await scheduleDoseReminder(updated, user?.notifyDose ?? true);
  // A tela inicial e o App (que reagenda as notificacoes quando `nextDoseAt` muda) leem do store.
  await useAppStore
    .getState()
    .refreshMedication()
    .catch(() => undefined);
  return updated;
}
