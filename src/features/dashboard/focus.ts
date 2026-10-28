/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
export type FocusKey = 'dose' | 'water' | 'weight' | 'meal';

export interface FocusItem {
  key: FocusKey;
  icon: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  /** Menor numero = mais urgente. */
  priority: number;
}

export interface FocusInput {
  now: Date;
  /** ISO da proxima dose do medicamento, ou null se nao ha medicamento cadastrado. */
  nextDoseAt: string | null;
  doseLoggedToday: boolean;
  waterConsumedMl: number;
  waterGoalMl: number;
  cupSizeMl: number;
  weightLoggedToday: boolean;
  mealLoggedToday: boolean;
}

const WATER_DAY_START_HOUR = 7;
const WATER_DAY_END_HOUR = 22;

function startOfDayMs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Quanto de agua ja deveria ter sido bebido a esta hora, distribuindo a meta entre 7h e 22h. */
export function expectedWaterMl(now: Date, goalMl: number): number {
  const hour = now.getHours() + now.getMinutes() / 60;
  const fraction = Math.min(1, Math.max(0, (hour - WATER_DAY_START_HOUR) / (WATER_DAY_END_HOUR - WATER_DAY_START_HOUR)));
  return Math.round(goalMl * fraction);
}

/** Lista o que o usuario deveria fazer agora, do mais urgente para o menos. Vazia = tudo em dia. */
export function getFocusItems(input: FocusInput): FocusItem[] {
  const items: FocusItem[] = [];
  const todayStart = startOfDayMs(input.now);
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  if (input.nextDoseAt && !input.doseLoggedToday) {
    const next = new Date(input.nextDoseAt).getTime();
    if (next < todayStart) {
      // Dias de calendario (dose de ontem as 23h = 1 dia), e nao blocos de 24h contados a partir do horario.
      // Arredondar absorve o dia de 23h/25h do horario de verao.
      const daysLate = Math.max(1, Math.round((todayStart - startOfDayMs(new Date(next))) / (24 * 60 * 60 * 1000)));
      items.push({
        key: 'dose',
        icon: '💉',
        title: 'Sua dose está atrasada',
        subtitle: daysLate === 1 ? 'Era para ontem. Registre assim que aplicar.' : `Era para ${daysLate} dias atrás. Registre assim que aplicar.`,
        actionLabel: 'Registrar dose',
        priority: 0,
      });
    } else if (next < tomorrowStart) {
      items.push({
        key: 'dose',
        icon: '💉',
        title: 'Hoje é dia da sua dose',
        subtitle: 'Aplique e registre para manter o rodízio de locais.',
        actionLabel: 'Registrar dose',
        priority: 1,
      });
    }
  }

  const expected = expectedWaterMl(input.now, input.waterGoalMl);
  const behindMl = expected - input.waterConsumedMl;
  if (behindMl >= input.cupSizeMl) {
    items.push({
      key: 'water',
      icon: '💧',
      title: `Beba água: faltam ${Math.max(0, input.waterGoalMl - input.waterConsumedMl)} ml hoje`,
      subtitle: `Você está ${Math.round(behindMl / 50) * 50} ml abaixo do ritmo para a meta.`,
      actionLabel: `+${input.cupSizeMl} ml`,
      priority: 2,
    });
  }

  if (!input.mealLoggedToday && input.now.getHours() >= 11) {
    items.push({
      key: 'meal',
      icon: '🍽️',
      title: 'Registre sua refeição',
      subtitle: 'Nenhuma refeição registrada hoje ainda.',
      actionLabel: 'Registrar',
      priority: 3,
    });
  }

  if (!input.weightLoggedToday && input.now.getHours() >= 18) {
    items.push({
      key: 'weight',
      icon: '⚖️',
      title: 'Registre seu peso de hoje',
      subtitle: 'Leva 10 segundos e mantém seu gráfico atualizado.',
      actionLabel: 'Registrar peso',
      priority: 4,
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}
