/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { ApplicationSite, EquipmentType, MealCategory, MuscleGroup, SymptomTag } from '../types';

export const APPLICATION_SITE_LABELS: Record<ApplicationSite, string> = {
  abdomen: 'Abdômen',
  coxa: 'Coxa',
  braco: 'Braço',
  outro: 'Outro',
};

export const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
};

export const SYMPTOM_TAG_LABELS: Record<SymptomTag, string> = {
  nausea: 'Náusea',
  fadiga: 'Fadiga',
  dor_de_cabeca: 'Dor de cabeça',
  constipacao: 'Constipação',
  outro: 'Outro',
};

export const ACTIVITY_TYPE_SUGGESTIONS = ['Caminhada', 'Musculação', 'Corrida', 'Outro'];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
  abdomen: 'Abdômen',
  cardio: 'Cardio',
  corpo_todo: 'Corpo todo',
};

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barra: 'Barra',
  halteres: 'Halteres',
  maquina: 'Máquina',
  cabo: 'Cabo/Polia',
  peso_corporal: 'Peso do corpo',
  kettlebell: 'Kettlebell',
  elastico: 'Elástico',
  nenhum: 'Nenhum',
};

export const SET_TYPE_LABELS: Record<'aquecimento' | 'normal' | 'dropset' | 'superset', string> = {
  aquecimento: 'Aquecimento',
  normal: 'Normal',
  dropset: 'Dropset',
  superset: 'Superset',
};
