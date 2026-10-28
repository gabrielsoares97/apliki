/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { MuscleGroup } from '../types';

/** Icones de saude/academia por grupo muscular. */
export const MUSCLE_GROUP_EMOJI: Record<MuscleGroup, string> = {
  peito: '🏋️',
  costas: '🏋️',
  ombros: '🏋️',
  biceps: '💪',
  triceps: '💪',
  quadriceps: '🦵',
  posterior: '🦵',
  gluteos: '🦵',
  panturrilha: '🦶',
  abdomen: '🧘',
  cardio: '🏃',
  corpo_todo: '❤️',
};
