/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { doseRepository, waterRepository } from '../db/repositories';
import { getUser } from '../db/repositories/userRepository';
import { getCurrentMedication } from '../db/repositories/medicationRepository';
import { syncMedicationWithDoses } from '../features/dose/doseSync';
import { suggestNextApplicationSite } from './applicationSite';
import { startOfDay } from './date';

/**
 * Registros de um toque, sem formulario. Usados pelo botao "+" e pelos botoes das notificacoes,
 * entao dependem so dos repositorios (nada de estado de tela) para funcionar com o app fechado.
 * O `id` opcional torna a gravacao idempotente: repetir a mesma acao nao duplica o registro.
 */

export interface QuickWaterResult {
  id: string;
  amountMl: number;
  totalTodayMl: number;
  goalMl: number;
}

export async function quickLogWater(options: { id?: string; at?: Date; amountMl?: number } = {}): Promise<QuickWaterResult> {
  const user = await getUser();
  const amountMl = options.amountMl ?? user?.cupSizeMl ?? 250;
  const goalMl = user?.dailyWaterGoalMl ?? 2000;

  const at = options.at ?? new Date();
  const created = await waterRepository.insert({ amountMl, dateTime: at.toISOString() }, options.id);

  const today = await waterRepository.listBetween(startOfDay(new Date()).toISOString(), new Date().toISOString());
  const totalTodayMl = today.reduce((sum, log) => sum + log.amountMl, 0);
  return { id: created.id, amountMl, totalTodayMl, goalMl };
}

export async function undoQuickWater(id: string): Promise<void> {
  await waterRepository.remove(id);
}

export interface QuickDoseResult {
  medicationName: string;
  doseMg: number;
  nextDoseAt: string;
}

/** Registra a dose com a dosagem padrao e o proximo local do rodizio. Retorna null se nao ha medicamento. */
export async function quickLogDose(options: { id?: string; at?: Date } = {}): Promise<QuickDoseResult | null> {
  const medication = await getCurrentMedication();
  if (!medication) return null;

  const doses = await doseRepository.listAll();
  // Reenvio da mesma acao (ex.: a fila caiu depois de gravar a dose): a dose ja existe, entao nada de
  // gravar de novo nem descontar a caneta duas vezes. So reconfere a proxima dose (operacao idempotente).
  const existing = options.id ? doses.find((d) => d.id === options.id) : undefined;
  if (existing) {
    const synced = await syncMedicationWithDoses(0);
    return { medicationName: medication.name, doseMg: existing.doseMg, nextDoseAt: synced?.nextDoseAt ?? medication.nextDoseAt };
  }

  const at = options.at ?? new Date();
  await doseRepository.insert(
    {
      medicationId: medication.id,
      doseMg: medication.defaultDoseMg,
      applicationSite: suggestNextApplicationSite(doses[0] ?? null),
      dateTime: at.toISOString(),
      notes: null,
    },
    options.id
  );

  // Proxima dose a partir da dose mais recente (a acao pode chegar atrasada) e uma dose a menos na caneta.
  const updated = await syncMedicationWithDoses(-1);
  return { medicationName: medication.name, doseMg: medication.defaultDoseMg, nextDoseAt: updated?.nextDoseAt ?? medication.nextDoseAt };
}
