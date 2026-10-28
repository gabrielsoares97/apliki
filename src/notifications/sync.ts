/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { reminderRepository } from '../db/repositories';
import { useAppStore } from '../store/useAppStore';
import { syncAllNotifications } from './notifications';

/**
 * Reagenda tudo a partir do estado atual da conta (perfil, medicamento e lembretes).
 * Nunca lanca erro: notificacao e um extra e nao pode quebrar a tela que chamou.
 */
export async function resyncNotifications(): Promise<void> {
  const { user, medication } = useAppStore.getState();
  if (!user) return;
  try {
    const reminders = await reminderRepository.listAll();
    await syncAllNotifications({ user, medication, reminders });
  } catch (error) {
    console.warn('[notifications] não foi possível sincronizar os lembretes.', error);
  }
}
