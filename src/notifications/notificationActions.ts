/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import type { NotificationResponse } from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';
import {
  ACTION_ADD_WATER,
  ACTION_LOG_DOSE,
  ACTION_SNOOZE,
  WATER_CATEGORY,
  getNotificationsModule,
  postConfirmationNotification,
  scheduleSnoozeNotification,
} from './notifications';
import { enqueueAction, flushPendingActions, markNotificationActionHandled, readQuickActionSettings } from './pendingActions';

/**
 * Trata os botoes das notificacoes (+ 1 copo, Depois, Registrei) sem abrir o app.
 * - App em segundo plano ou fechado: o Android executa a tarefa registrada abaixo (expo-task-manager).
 * - App aberto: o listener registrado em initNotificationActions recebe a resposta.
 * A tarefa e o registro dela ficam no escopo do modulo e este arquivo e importado em index.ts, antes do App,
 * porque o Android carrega o bundle em segundo plano e precisa achar a tarefa definida logo no inicio.
 *
 * A acao grava primeiro numa fila local (instantaneo, sem rede) e depois tenta enviar ao Firestore;
 * o que nao chegar a ser enviado sai na proxima abertura do app (ver pendingActions.ts).
 */

const TASK_NAME = 'APLIKI_NOTIFICATION_ACTIONS';
const FLUSH_WAIT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

/**
 * Avisa as telas abertas: `bump` recarrega os dados agregados e o medicamento/perfil do store sao relidos
 * (a dose muda a proxima aplicacao e a caneta). Com o app fechado o store nao tem perfil e nao ha tela.
 */
function refreshStoreAfterQuickAction(): void {
  const store = useAppStore.getState();
  store.bump();
  if (!store.user) return;
  Promise.all([store.refreshMedication(), store.refreshUser()]).catch((error) => {
    console.warn('[notifications] não foi possível atualizar os dados na tela.', error);
  });
}

export async function handleNotificationResponse(response: NotificationResponse): Promise<void> {
  const actionId = response.actionIdentifier;
  if (actionId !== ACTION_ADD_WATER && actionId !== ACTION_SNOOZE && actionId !== ACTION_LOG_DOSE) return;

  const key = `${response.notification.request.identifier}:${actionId}:${response.notification.date}`;
  if (!(await markNotificationActionHandled(key))) return;

  try {
    if (actionId === ACTION_SNOOZE) {
      const { title, body } = response.notification.request.content;
      await scheduleSnoozeNotification(title ?? 'Hora de beber água 💧', body ?? '', WATER_CATEGORY, 30);
      return;
    }

    if (actionId === ACTION_ADD_WATER) {
      const settings = await readQuickActionSettings();
      await enqueueAction({ kind: 'water', atIso: new Date().toISOString(), amountMl: settings.cupSizeMl });
      const flush = await withTimeout(flushPendingActions(), FLUSH_WAIT_MS);
      if (flush?.lastWater) {
        await postConfirmationNotification(
          `💧 +${flush.lastWater.amountMl} ml registrados`,
          `Hoje: ${flush.lastWater.totalTodayMl} de ${flush.lastWater.goalMl} ml`
        );
      } else {
        await postConfirmationNotification(`💧 +${settings.cupSizeMl} ml anotados`, 'Vão para o seu histórico assim que o app sincronizar.');
      }
    } else {
      await enqueueAction({ kind: 'dose', atIso: new Date().toISOString() });
      const flush = await withTimeout(flushPendingActions(), FLUSH_WAIT_MS);
      if (flush && flush.lastDose === null) {
        await postConfirmationNotification('Cadastre seu medicamento', 'Abra o app para cadastrar o medicamento e poder registrar doses.');
      } else if (flush?.lastDose) {
        await postConfirmationNotification('💉 Dose registrada', `${flush.lastDose.medicationName} — ${flush.lastDose.doseMg} mg. Próxima dose já agendada.`);
      } else {
        await postConfirmationNotification('💉 Dose anotada', 'Vai para o seu histórico assim que o app sincronizar.');
      }
    }
    refreshStoreAfterQuickAction();
  } catch (error) {
    console.warn('[notifications] falha ao processar ação da notificação.', error);
    await postConfirmationNotification('Não foi possível registrar', error instanceof Error ? error.message : 'Abra o app e tente novamente.');
  }
}

const Notifications = Platform.OS === 'web' ? null : getNotificationsModule();

if (Notifications) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
    TaskManager.defineTask(TASK_NAME, async ({ data }: { data: unknown }) => {
      if (data && typeof data === 'object' && 'actionIdentifier' in data) {
        await handleNotificationResponse(data as NotificationResponse);
      }
    });
    Notifications.registerTaskAsync(TASK_NAME).catch((error) => {
      console.warn('[notifications] não foi possível registrar a tarefa de ações.', error);
    });
  } catch (error) {
    console.warn('[notifications] tarefa de ações indisponível neste ambiente.', error);
  }
}

/** Escuta os botoes tocados com o app aberto. Retorna a funcao de limpeza. */
export function initNotificationActions(): () => void {
  if (!Notifications) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response);
  });
  return () => subscription.remove();
}
