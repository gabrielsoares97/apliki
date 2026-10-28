/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { weightRepository } from '../../db/repositories';
import { useAppStore } from '../../store/useAppStore';

/**
 * Depois de qualquer insercao, edicao ou exclusao de peso, o "peso atual" do perfil passa a ser o do
 * registro mais recente por data (registrar um peso antigo nao pode sobrescrever o atual).
 * Sem nenhum registro volta para o peso inicial informado no cadastro.
 */
export async function syncCurrentWeightWithLogs(): Promise<void> {
  const { user, patchUser } = useAppStore.getState();
  if (!user) return;
  const logs = await weightRepository.listAll(); // mais recente primeiro
  const currentWeightKg = logs[0]?.weightKg ?? user.startWeightKg ?? null;
  if (currentWeightKg !== user.currentWeightKg) await patchUser({ currentWeightKg });
}
