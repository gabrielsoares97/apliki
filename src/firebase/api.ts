/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Servidor do apliKI (Cloudflare Worker): análise de refeições por IA na raiz e cobrança em /billing.
 * As chaves ficam só no servidor; o app se identifica com o token de login do Firebase.
 */
export const API_URL = 'https://monju-ai-worker.apliki.workers.dev';

/** Site do apliKI: páginas de Termos de Uso e Política de Privacidade. */
export const SITE_URL = 'https://apliki.web.app';
