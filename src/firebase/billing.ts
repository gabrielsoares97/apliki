/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { auth } from './config';
import { API_URL } from './api';
import { DEFAULT_PLANS, type Plan, type PlanId } from '../shared/plans';

/**
 * Cobrança das assinaturas. O pagamento acontece na página segura da Stripe, aberta no navegador;
 * quem libera o acesso é o servidor, quando a Stripe confirma o pagamento. O app só acompanha
 * subscriptions/{uid} (useSubscriptionStore) e libera sozinho quando o documento muda.
 */
export interface BillingConfig {
  /** false enquanto a cobrança online não foi ligada no servidor: o app mostra os contatos para assinar. */
  configured: boolean;
  plans: Plan[];
}

export class BillingError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

let cachedConfig: BillingConfig | null = null;

export async function getBillingConfig(): Promise<BillingConfig> {
  if (cachedConfig) return cachedConfig;
  try {
    const response = await fetch(`${API_URL}/billing/config`);
    const data = (await response.json()) as Partial<BillingConfig>;
    if (!response.ok || typeof data.configured !== 'boolean') throw new Error('invalid');
    const plans = (data.plans ?? []).filter(
      (p): p is Plan => (p.id === 'mensal' || p.id === 'anual') && typeof p.amount === 'number' && p.amount > 0
    );
    const config = { configured: data.configured && plans.length === 2, plans: plans.length === 2 ? plans : DEFAULT_PLANS };
    // Só guarda a resposta "ligada": se a cobrança for ativada depois, o app percebe na próxima abertura da tela.
    if (config.configured) cachedConfig = config;
    return config;
  } catch {
    return { configured: false, plans: DEFAULT_PLANS };
  }
}

/** Quando o app abriu o pagamento ou o portal pela última vez (para conferir a assinatura na volta). */
let billingOpenedAt = 0;

async function post(path: string, body: Record<string, unknown>): Promise<{ url?: string }> {
  const user = auth.currentUser;
  if (!user) throw new BillingError('unauthenticated', 'Você precisa estar logado.');
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      // O servidor decide para onde voltar depois do pagamento conforme a origem (navegador ou app).
      body: JSON.stringify({ ...body, from: Platform.OS === 'web' ? 'web' : 'app' }),
    });
  } catch {
    throw new BillingError('network', 'Sem conexão com o servidor. Verifique sua internet e tente novamente.');
  }
  const data = (await response.json().catch(() => null)) as { url?: string; error?: string; message?: string } | null;
  if (!response.ok) {
    throw new BillingError(data?.error ?? 'unavailable', data?.message ?? 'Não foi possível falar com o serviço de pagamento. Tente novamente.');
  }
  return { url: data?.url };
}

async function postForUrl(path: string, body: Record<string, unknown>): Promise<string> {
  const { url } = await post(path, body);
  if (!url) throw new BillingError('unavailable', 'Não foi possível abrir o pagamento. Tente novamente.');
  return url;
}

async function open(url: string): Promise<void> {
  billingOpenedAt = Date.now();
  if (Platform.OS === 'web') {
    // Mesma aba: depois do pagamento a Stripe devolve a pessoa para o app.
    window.location.assign(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

/** Abre a página de pagamento do plano escolhido. */
export async function startCheckout(plan: PlanId): Promise<void> {
  await open(await postForUrl('/billing/checkout', { plan }));
}

/** Abre o portal do cliente: trocar cartão, mudar de plano, cancelar e ver recibos. */
export async function openBillingPortal(): Promise<void> {
  await open(await postForUrl('/billing/portal', {}));
}

/**
 * Pede ao servidor para conferir a assinatura na Stripe agora. Normalmente o aviso da Stripe já resolve
 * sozinho; isto cobre o caso de ele atrasar. Falhas são ignoradas: é só um reforço.
 */
export async function syncBilling(): Promise<void> {
  await post('/billing/sync', {}).catch(() => undefined);
}

/** Na volta ao app: confere a assinatura se o pagamento ou o portal foi aberto há pouco. */
export function syncBillingIfRecentlyOpened(): void {
  if (billingOpenedAt && Date.now() - billingOpenedAt < 30 * 60_000) syncBilling();
}

/**
 * Exclusão de conta: cancela a assinatura paga e apaga os registros de cobrança no servidor.
 * Lança erro se não der para cancelar, para a conta nunca ser excluída com uma cobrança ainda ativa.
 */
export async function deleteBillingData(): Promise<void> {
  try {
    await post('/billing/delete', {});
  } catch (error) {
    // Cobrança online desligada no servidor: não existe assinatura paga para cancelar.
    if (error instanceof BillingError && error.code === 'billing_not_configured') return;
    throw new BillingError(
      'delete_failed',
      'Não foi possível cancelar sua assinatura agora, então a conta não foi excluída. Verifique sua internet e tente de novo.'
    );
  }
}
