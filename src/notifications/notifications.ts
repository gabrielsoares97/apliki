/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import Constants, { AppOwnership } from 'expo-constants';
import { Medication, Reminder, User } from '../types';
import { planReminder, PlannedTrigger } from '../shared/reminderPlan';

/**
 * Notificações são um "nice to have": uma falha aqui nunca pode impedir o usuário de salvar
 * uma dose, peso, refeição etc. Por isso todas as funções abaixo são à prova de falha — qualquer
 * erro (módulo indisponível, permissão negada, ambiente sem suporte) é engolido e logado, nunca
 * propagado para quem chamou.
 *
 * Além disso, desde o SDK 53 do Expo, o Expo Go no Android não suporta mais o módulo nativo
 * completo de expo-notifications, e o navegador (web) também não suporta agendamento local.
 * Nesses casos nem importamos o módulo (importar já derruba o app no Expo Go Android).
 */
const REST_NOTIFICATION_ID = 'rest-timer';
const REST_CHANNEL_ID = 'rest-timer';
const REMINDER_CHANNEL_ID = 'reminders-v2';
const CONFIRM_CHANNEL_ID = 'confirmations';

/** Categorias (nomes sem "-" nem ":") e ids das acoes exibidas como botoes nas notificacoes. */
export const WATER_CATEGORY = 'water_reminder';
export const DOSE_CATEGORY = 'dose_reminder';
export const ACTION_ADD_WATER = 'add_water';
export const ACTION_SNOOZE = 'snooze';
export const ACTION_LOG_DOSE = 'log_dose';

const isUnsupportedEnvironment =
  Platform.OS === 'web' || (Platform.OS === 'android' && Constants.appOwnership === AppOwnership.Expo);

type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;

if (!isUnsupportedEnvironment) {
  try {
    Notifications = require('expo-notifications') as NotificationsModule;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Lembretes apliKI',
        importance: Notifications.AndroidImportance.HIGH,
      });
      // O canal 'default' antigo foi criado sem som, entao o Android nao o exibe como popup e nao da
      // para altera-lo depois de criado. Lembretes usam este canal novo, com som e vibracao.
      Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: 'Lembretes (dose, água, refeição)',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 400, 250, 400],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      Notifications.setNotificationChannelAsync(REST_CHANNEL_ID, {
        name: 'Pausa do treino',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500, 200, 500],
      });
      Notifications.setNotificationChannelAsync(CONFIRM_CHANNEL_ID, {
        name: 'Confirmações de registro',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
      });
    }

    // Botoes de acao nas notificacoes: registrar sem abrir o app.
    Notifications.setNotificationCategoryAsync(WATER_CATEGORY, [
      { identifier: ACTION_ADD_WATER, buttonTitle: '+ 1 copo', options: { opensAppToForeground: false } },
      { identifier: ACTION_SNOOZE, buttonTitle: 'Depois (30 min)', options: { opensAppToForeground: false } },
    ]);
    Notifications.setNotificationCategoryAsync(DOSE_CATEGORY, [
      { identifier: ACTION_LOG_DOSE, buttonTitle: 'Registrei ✓', options: { opensAppToForeground: false } },
    ]);
  } catch (error) {
    console.warn('[notifications] módulo indisponível neste ambiente, notificações desativadas.', error);
    Notifications = null;
  }
}

/** Modulo nativo de notificacoes, ou null onde nao ha suporte (web, Expo Go no Android). */
export function getNotificationsModule(): NotificationsModule | null {
  return Notifications;
}

/** Notificacao silenciosa de confirmacao (ex.: "+250 ml registrados") depois de uma acao rapida. */
export async function postConfirmationNotification(title: string, body: string): Promise<void> {
  if (!Notifications) return;
  await safely(() =>
    Notifications!.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: Platform.OS === 'android' ? { channelId: CONFIRM_CHANNEL_ID } : null,
    })
  );
}

/** Repete um lembrete daqui a alguns minutos (botao "Depois"). */
export async function scheduleSnoozeNotification(title: string, body: string, categoryIdentifier: string, minutes: number): Promise<void> {
  if (!Notifications) return;
  await safely(() =>
    Notifications!.scheduleNotificationAsync({
      content: { title, body, sound: 'default', categoryIdentifier, priority: Notifications!.AndroidNotificationPriority.MAX },
      trigger: {
        type: Notifications!.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: REMINDER_CHANNEL_ID,
      },
    })
  );
}

async function safely<T>(action: () => Promise<T>): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    console.warn('[notifications] operação falhou, ignorando.', error);
    return undefined;
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const result = await safely(async () => {
    const current = await Notifications!.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications!.requestPermissionsAsync();
    return requested.granted;
  });
  return result ?? false;
}

/** Agenda o aviso (som + vibração) do fim da pausa do treino, que dispara mesmo com o app em segundo plano. */
export async function scheduleRestEndNotification(seconds: number): Promise<void> {
  if (!Notifications || seconds <= 0) return;
  await safely(async () => {
    await Notifications!.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID);
    await Notifications!.scheduleNotificationAsync({
      identifier: REST_NOTIFICATION_ID,
      content: {
        title: 'Pausa terminou 💪',
        body: 'Hora da próxima série!',
        sound: 'default',
      },
      trigger: {
        type: Notifications!.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.ceil(seconds),
        channelId: REST_CHANNEL_ID,
      },
    });
  });
}

export async function cancelRestEndNotification(): Promise<void> {
  if (!Notifications) return;
  await safely(() => Notifications!.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID));
}

const DOSE_NOTIFICATION_ID = 'dose-reminder';
const DOSE_LATE_NOTIFICATION_ID = 'dose-reminder-late';
const REMINDER_NOTIFICATION_PREFIX = 'reminder-';
const AUTO_NOTIFICATION_PREFIX = 'auto-';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Lembretes fixos ligados pelos interruptores "Lembrete de refeicao" e "Lembrete de atividade" do perfil. */
const MEAL_SLOTS = [
  { key: 'cafe', hour: 8, minute: 0, title: 'Hora do café da manhã 🍽️' },
  { key: 'almoco', hour: 12, minute: 30, title: 'Hora do almoço 🍽️' },
  { key: 'jantar', hour: 19, minute: 30, title: 'Hora do jantar 🍽️' },
];
const ACTIVITY_SLOT = { hour: 18, minute: 0 };

type ScheduleRequest = Parameters<NotificationsModule['scheduleNotificationAsync']>[0];

/**
 * Todas as operacoes de agendamento passam por esta fila, uma de cada vez. Sem isso, o reagendamento
 * feito na abertura do app podia rodar junto com o de uma tela e um cancelava o que o outro tinha
 * acabado de agendar.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue(action: () => Promise<void>): Promise<void> {
  const run = queue.then(() => safely(action)).then(() => undefined);
  queue = run;
  return run;
}

function isManagedIdentifier(identifier: string): boolean {
  return (
    identifier === DOSE_NOTIFICATION_ID ||
    identifier === DOSE_LATE_NOTIFICATION_ID ||
    identifier.startsWith(REMINDER_NOTIFICATION_PREFIX) ||
    identifier.startsWith(AUTO_NOTIFICATION_PREFIX)
  );
}

function toTriggerInput(trigger: PlannedTrigger): ScheduleRequest['trigger'] {
  const types = Notifications!.SchedulableTriggerInputTypes;
  switch (trigger.kind) {
    case 'daily':
      return { type: types.DAILY, hour: trigger.hour, minute: trigger.minute, channelId: REMINDER_CHANNEL_ID };
    case 'weekly':
      // expo-notifications usa 1=domingo
      return { type: types.WEEKLY, weekday: trigger.weekday + 1, hour: trigger.hour, minute: trigger.minute, channelId: REMINDER_CHANNEL_ID };
    case 'date':
      return { type: types.DATE, date: trigger.date, channelId: REMINDER_CHANNEL_ID };
  }
}

function reminderContent(title: string, body: string, categoryIdentifier?: string): ScheduleRequest['content'] {
  return { title, body, sound: 'default', categoryIdentifier, priority: Notifications!.AndroidNotificationPriority.MAX };
}

function doseRequests(medication: Medication): ScheduleRequest[] {
  const doseAt = new Date(medication.nextDoseAt);
  if (Number.isNaN(doseAt.getTime())) return [];
  const now = Date.now();
  const requests: ScheduleRequest[] = [];

  if (doseAt.getTime() > now) {
    requests.push({
      identifier: DOSE_NOTIFICATION_ID,
      content: reminderContent('Hora da sua dose 💉', `${medication.name} — não esqueça de registrar a aplicação.`, DOSE_CATEGORY),
      trigger: toTriggerInput({ kind: 'date', date: doseAt }),
    });
  }
  // Segundo aviso um dia depois. Registrar a dose muda `nextDoseAt` e este aviso e reagendado junto.
  const lateAt = new Date(doseAt.getTime() + DAY_MS);
  if (lateAt.getTime() > now) {
    requests.push({
      identifier: DOSE_LATE_NOTIFICATION_ID,
      content: reminderContent('Dose atrasada 💉', `${medication.name} — a aplicação de ontem ainda não foi registrada.`, DOSE_CATEGORY),
      trigger: toTriggerInput({ kind: 'date', date: lateAt }),
    });
  }
  return requests;
}

function reminderRequests(reminder: Reminder): ScheduleRequest[] {
  return planReminder(reminder).map(({ key, trigger }) => ({
    identifier: `${REMINDER_NOTIFICATION_PREFIX}${reminder.id}-${key}`,
    content: reminderContent(reminderTitle(reminder), reminder.name, reminder.type === 'water' ? WATER_CATEGORY : undefined),
    trigger: toTriggerInput(trigger),
  }));
}

function autoRequests(user: Pick<User, 'notifyMeal' | 'notifyActivity'>): ScheduleRequest[] {
  const requests: ScheduleRequest[] = [];
  if (user.notifyMeal) {
    for (const slot of MEAL_SLOTS) {
      requests.push({
        identifier: `${AUTO_NOTIFICATION_PREFIX}meal-${slot.key}`,
        content: reminderContent(slot.title, 'Registre sua refeição para acompanhar calorias e proteína.'),
        trigger: toTriggerInput({ kind: 'daily', hour: slot.hour, minute: slot.minute }),
      });
    }
  }
  if (user.notifyActivity) {
    requests.push({
      identifier: `${AUTO_NOTIFICATION_PREFIX}activity`,
      content: reminderContent('Hora de se movimentar 🏃', 'Uma caminhada ou um treino hoje já contam. Registre sua atividade.'),
      trigger: toTriggerInput({ kind: 'daily', hour: ACTIVITY_SLOT.hour, minute: ACTIVITY_SLOT.minute }),
    });
  }
  return requests;
}

function isReminderEnabled(reminder: Reminder, user: Pick<User, 'notifyWater' | 'notifyMeal'>): boolean {
  if (!reminder.active) return false;
  if (reminder.type === 'water') return user.notifyWater;
  if (reminder.type === 'meal') return user.notifyMeal;
  return true;
}

async function cancelWhere(predicate: (identifier: string) => boolean): Promise<void> {
  const scheduled = await Notifications!.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((n) => predicate(n.identifier)).map((n) => Notifications!.cancelScheduledNotificationAsync(n.identifier)));
}

async function scheduleAll(requests: ScheduleRequest[]): Promise<void> {
  // Uma falha num agendamento nao pode impedir os demais.
  for (const request of requests) await safely(() => Notifications!.scheduleNotificationAsync(request));
}

/**
 * Deixa as notificacoes agendadas iguais ao que esta configurado na conta: agenda o que falta e cancela
 * o que sobrou (lembrete apagado em outro aparelho, interruptor desligado, conta anterior).
 * Chamado na abertura do app e sempre que uma preferencia de notificacao muda.
 */
export function syncAllNotifications(state: { user: User; medication: Medication | null; reminders: Reminder[] }): Promise<void> {
  if (!Notifications) return Promise.resolve();
  const { user, medication, reminders } = state;
  return enqueue(async () => {
    const requests: ScheduleRequest[] = [
      ...(user.notifyDose && medication ? doseRequests(medication) : []),
      ...reminders.filter((r) => isReminderEnabled(r, user)).flatMap(reminderRequests),
      ...autoRequests(user),
    ];
    const wanted = new Set(requests.map((r) => r.identifier));
    await cancelWhere((identifier) => isManagedIdentifier(identifier) && !wanted.has(identifier));
    await scheduleAll(requests);
  });
}

/** Cancela tudo o que o app agendou (usado ao sair da conta e ao apagar os dados). */
export function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return Promise.resolve();
  return enqueue(() => Notifications!.cancelAllScheduledNotificationsAsync());
}

/** Cancela e reagenda a notificação da próxima dose do medicamento principal. */
export function scheduleDoseReminder(medication: Medication, enabled: boolean): Promise<void> {
  if (!Notifications) return Promise.resolve();
  return enqueue(async () => {
    await Notifications!.cancelScheduledNotificationAsync(DOSE_NOTIFICATION_ID);
    await Notifications!.cancelScheduledNotificationAsync(DOSE_LATE_NOTIFICATION_ID);
    if (enabled) await scheduleAll(doseRequests(medication));
  });
}

/** Agenda as notificações recorrentes de um lembrete (suplemento/água/refeição), respeitando as datas puladas. */
export function scheduleReminderNotifications(reminder: Reminder): Promise<void> {
  if (!Notifications) return Promise.resolve();
  return enqueue(async () => {
    await cancelWhere((identifier) => identifier.startsWith(`${REMINDER_NOTIFICATION_PREFIX}${reminder.id}-`));
    await scheduleAll(reminderRequests(reminder));
  });
}

export function cancelReminderNotifications(reminderId: string): Promise<void> {
  if (!Notifications) return Promise.resolve();
  return enqueue(() => cancelWhere((identifier) => identifier.startsWith(`${REMINDER_NOTIFICATION_PREFIX}${reminderId}-`)));
}

export type NotificationPermissionState = 'granted' | 'denied' | 'unsupported';

/** Situacao da permissao no sistema, para a tela avisar quando as notificacoes estao bloqueadas. */
export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (!Notifications) return 'unsupported';
  const granted = await safely(async () => (await Notifications!.getPermissionsAsync()).granted);
  return granted ? 'granted' : 'denied';
}

/** Dispara uma notificacao em 5 segundos, para a pessoa conferir som, popup e permissao. */
export async function sendTestNotification(): Promise<boolean> {
  if (!Notifications) return false;
  const id = await safely(() =>
    Notifications!.scheduleNotificationAsync({
      content: reminderContent('Notificações funcionando ✅', 'É assim que os lembretes do apliKI vão aparecer.'),
      trigger: { type: Notifications!.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: REMINDER_CHANNEL_ID },
    })
  );
  return !!id;
}

function reminderTitle(reminder: Reminder): string {
  switch (reminder.type) {
    case 'supplement':
      return 'Lembrete de suplemento';
    case 'med':
      return 'Lembrete de medicamento';
    case 'water':
      return 'Hora de beber água 💧';
    case 'meal':
      return 'Hora da refeição 🍽️';
    default:
      return 'Lembrete';
  }
}
