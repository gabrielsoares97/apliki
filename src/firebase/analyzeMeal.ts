/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { auth } from './config';

export interface AnalyzeMealItem {
  name: string;
  quantity: string;
}

export interface AnalyzeMealInput {
  items: AnalyzeMealItem[];
}

export interface AnalyzeMealItemOutput {
  food: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
}

export interface AnalyzeMealOutput {
  name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  /** Valores calculados para cada alimento (ja multiplicados pela quantidade). */
  items?: AnalyzeMealItemOutput[];
}

/**
 * URL do Worker do Cloudflare (grátis) que faz a chamada à API paga da Claude mantendo a chave no
 * servidor (código em cloudflare-worker/). O Worker calcula cada alimento com a sua quantidade e soma o total.
 */
const AI_WORKER_URL = 'https://monju-ai-worker.apliki.workers.dev';

export async function analyzeMeal(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  const user = auth.currentUser;
  if (!user) throw new Error('Você precisa estar logado.');

  const token = await user.getIdToken();

  let response: Response;
  try {
    response = await fetch(AI_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      // "description" e o formato antigo do Worker, enviado junto para nao quebrar se ele ainda nao foi atualizado.
      body: JSON.stringify({
        items: input.items,
        description: input.items.map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name)).join('; '),
      }),
    });
  } catch {
    throw new Error('Sem conexão com o serviço de IA. Tente novamente.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    throw new Error((data as { message?: string } | null)?.message ?? 'Não foi possível reconhecer a refeição. Tente novamente.');
  }

  return data as AnalyzeMealOutput;
}
