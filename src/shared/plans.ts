/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Planos do apliKI. Os valores mostrados vêm do servidor (que lê os preços da Stripe); estes são o padrão
 * usado enquanto a resposta não chega ou se o servidor estiver fora do ar.
 */
export type PlanId = 'mensal' | 'anual';

export interface Plan {
  id: PlanId;
  /** Valor cobrado a cada período, em centavos. */
  amount: number;
  interval: 'month' | 'year';
}

export const DEFAULT_PLANS: Plan[] = [
  { id: 'mensal', amount: 2990, interval: 'month' },
  { id: 'anual', amount: 19990, interval: 'year' },
];

export const PLAN_NAMES: Record<PlanId, string> = { mensal: 'Mensal', anual: 'Anual' };

/** "R$ 29,90" */
export function formatBRL(cents: number): string {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  return `R$ ${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Quanto o plano custa por mês, em centavos (o anual dividido por 12). */
export function monthlyCents(plan: Plan): number {
  return plan.interval === 'year' ? Math.round(plan.amount / 12) : plan.amount;
}

/** Desconto do anual em relação a pagar 12 mensalidades, em % inteiro (0 se não houver). */
export function yearlySavingsPercent(plans: Plan[]): number {
  const monthly = plans.find((p) => p.interval === 'month');
  const yearly = plans.find((p) => p.interval === 'year');
  if (!monthly || !yearly || monthly.amount <= 0) return 0;
  return Math.max(0, Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100));
}
