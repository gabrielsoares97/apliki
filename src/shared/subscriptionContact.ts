/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
/**
 * Onde a pessoa fala com o apliKI para assinar ou renovar. Quem personalizar o app mantém estes contatos:
 * a assinatura é sempre feita com o apliKI (veja LICENSE).
 */
export const SUBSCRIPTION_CONTACT = {
  /** Número com DDI e DDD, só dígitos (ex.: '5511999998888'). Vazio esconde o botão. */
  whatsapp: '5547992201382',
  /** E-mail de atendimento. Vazio esconde o botão. */
  email: 'contato@gabrielsoares.me',
} as const;
