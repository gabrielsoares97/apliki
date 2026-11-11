/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { daysLeft, type EffectiveStatus, type Subscription } from '../../firebase/subscription';

export interface SubscriptionSummary {
  /** Linha curta para o cabeçalho da seção. */
  hint: string;
  /** Explicação completa. */
  detail: string;
  /** O que oferecer: assinar um plano, gerenciar a assinatura paga ou nada (acesso liberado pelo apliKI). */
  action: 'subscribe' | 'manage' | 'none';
}

const PLAN_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
  vitalicio: 'Vitalício',
  cortesia: 'Cortesia',
};

function days(count: number): string {
  return count === 0 ? 'vence hoje' : count === 1 ? 'falta 1 dia' : `faltam ${count} dias`;
}

/** Texto e ação da assinatura para o Perfil e o aviso do Início. Função pura, para poder ser testada. */
export function summarizeSubscription(
  sub: Subscription | null,
  status: EffectiveStatus,
  hasPaidSubscription = false,
  now = Date.now()
): SubscriptionSummary {
  const summary = baseSummary(sub, status, now);
  // Com assinatura paga em andamento a ação é sempre gerenciar (trocar cartão, cancelar), nunca assinar de novo.
  return hasPaidSubscription ? { ...summary, action: 'manage' } : summary;
}

function baseSummary(sub: Subscription | null, status: EffectiveStatus, now: number): SubscriptionSummary {
  const until = sub?.expiresAt ? sub.expiresAt.toDate().toLocaleDateString('pt-BR') : null;
  const remaining = daysLeft(sub, now);
  const planText = sub && PLAN_LABEL[sub.plan] ? `Plano ${PLAN_LABEL[sub.plan]}` : 'Assinatura';

  if (status === 'trial') {
    return {
      hint: `Teste grátis · ${days(remaining ?? 0)}`,
      detail: `Você está no teste grátis${until ? ` até ${until}` : ''}. Assine para continuar registrando e usando a IA depois disso.`,
      action: 'subscribe',
    };
  }

  if (status === 'active' && sub?.provider === 'stripe') {
    if (sub.cancelAtPeriodEnd) {
      return {
        hint: `${planText} · termina em ${until}`,
        detail: `Sua assinatura não será renovada e o acesso termina em ${until}. Você pode reativar quando quiser em "Gerenciar assinatura".`,
        action: 'manage',
      };
    }
    return {
      hint: `${planText} · renova automaticamente`,
      detail: 'Sua assinatura está ativa e renova sozinha. Em "Gerenciar assinatura" você troca o cartão, muda de plano, vê os recibos ou cancela.',
      action: 'manage',
    };
  }

  if (status === 'active') {
    return {
      hint: until ? `Ativa até ${until}` : 'Ativa',
      detail: until
        ? `Seu acesso está liberado até ${until}. Depois dessa data, assine um plano para continuar.`
        : 'Seu acesso está liberado e não tem data de vencimento.',
      // Acesso liberado pelo apliKI com data: a pessoa já pode assinar para não ficar sem acesso depois.
      action: until ? 'subscribe' : 'none',
    };
  }

  return {
    hint: status === 'canceled' ? 'Cancelada' : 'Inativa',
    detail: 'Sua assinatura não está ativa. Assine para voltar a registrar e usar a IA.',
    action: 'subscribe',
  };
}
