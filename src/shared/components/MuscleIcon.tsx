/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { MuscleGroup } from '../../types';

interface MuscleIconProps {
  muscleGroup: MuscleGroup;
  /** Cor do musculo destacado (ex.: a do status de recuperacao). */
  color: string;
  size?: number;
}

type Region = { shape: 'rect'; x: number; y: number; w: number; h: number; r?: number } | { shape: 'circle'; cx: number; cy: number; r: number };

/** Regioes destacadas por musculo, no boneco de frente (front) ou de costas (back). Coordenadas em viewBox 40x64. */
const MUSCLE_REGIONS: Partial<Record<MuscleGroup, { view: 'front' | 'back'; regions: Region[] }>> = {
  peito: {
    view: 'front',
    regions: [
      { shape: 'rect', x: 12.5, y: 14.5, w: 7, h: 7.5, r: 2.5 },
      { shape: 'rect', x: 20.5, y: 14.5, w: 7, h: 7.5, r: 2.5 },
    ],
  },
  ombros: {
    view: 'front',
    regions: [
      { shape: 'circle', cx: 9.5, cy: 15.5, r: 4.6 },
      { shape: 'circle', cx: 30.5, cy: 15.5, r: 4.6 },
    ],
  },
  biceps: {
    view: 'front',
    regions: [
      { shape: 'rect', x: 5.5, y: 19, w: 5, h: 9.5, r: 2.5 },
      { shape: 'rect', x: 29.5, y: 19, w: 5, h: 9.5, r: 2.5 },
    ],
  },
  abdomen: { view: 'front', regions: [{ shape: 'rect', x: 15, y: 24, w: 10, h: 12, r: 3 }] },
  quadriceps: {
    view: 'front',
    regions: [
      { shape: 'rect', x: 12.5, y: 37.5, w: 7, h: 15, r: 3 },
      { shape: 'rect', x: 20.5, y: 37.5, w: 7, h: 15, r: 3 },
    ],
  },
  costas: { view: 'back', regions: [{ shape: 'rect', x: 12.5, y: 14.5, w: 15, h: 16, r: 4 }] },
  triceps: {
    view: 'back',
    regions: [
      { shape: 'rect', x: 5.5, y: 19, w: 5, h: 9.5, r: 2.5 },
      { shape: 'rect', x: 29.5, y: 19, w: 5, h: 9.5, r: 2.5 },
    ],
  },
  gluteos: {
    view: 'back',
    regions: [
      { shape: 'circle', cx: 16.3, cy: 39.5, r: 4.3 },
      { shape: 'circle', cx: 23.7, cy: 39.5, r: 4.3 },
    ],
  },
  posterior: {
    view: 'back',
    regions: [
      { shape: 'rect', x: 12.5, y: 44, w: 7, h: 10, r: 3 },
      { shape: 'rect', x: 20.5, y: 44, w: 7, h: 10, r: 3 },
    ],
  },
  panturrilha: {
    view: 'back',
    regions: [
      { shape: 'rect', x: 13, y: 55, w: 6, h: 8, r: 2.5 },
      { shape: 'rect', x: 21, y: 55, w: 6, h: 8, r: 2.5 },
    ],
  },
};

const HEART_PATH = 'M20 54 C4 42 6 26 14 26 C17 26 19.5 28 20 30 C20.5 28 23 26 26 26 C34 26 36 42 20 54 Z';

function renderRegion(region: Region, key: number, color: string) {
  return region.shape === 'rect' ? (
    <Rect key={key} x={region.x} y={region.y} width={region.w} height={region.h} rx={region.r ?? 0} fill={color} />
  ) : (
    <Circle key={key} cx={region.cx} cy={region.cy} r={region.r} fill={color} />
  );
}

/** Boneco simplificado (frente ou costas) com o musculo do treino destacado. */
export function MuscleIcon({ muscleGroup, color, size = 44 }: MuscleIconProps) {
  // Mais claro que a borda dos cards para a silhueta aparecer nos dois temas, mas ainda discreto.
  const base = colors.textSecondary + '55';
  const height = (size * 64) / 40;

  // Cardio: coracao. Corpo todo: boneco inteiro destacado.
  if (muscleGroup === 'cardio') {
    return (
      <Svg width={size} height={height} viewBox="0 0 40 64">
        <Path d={HEART_PATH} fill={color} transform="translate(0 -4)" />
      </Svg>
    );
  }

  const definition = MUSCLE_REGIONS[muscleGroup];
  const allBody = muscleGroup === 'corpo_todo';
  const fill = allBody ? color : base;

  return (
    <Svg width={size} height={height} viewBox="0 0 40 64">
      {/* silhueta */}
      <Circle cx={20} cy={6} r={5} fill={fill} />
      <Rect x={17.5} y={10.5} width={5} height={3.5} rx={1.5} fill={fill} />
      <Rect x={12} y={13.5} width={16} height={23} rx={5} fill={fill} />
      <Rect x={5} y={14} width={6.5} height={15} rx={3} fill={fill} />
      <Rect x={28.5} y={14} width={6.5} height={15} rx={3} fill={fill} />
      <Rect x={4.5} y={30} width={5.5} height={13} rx={2.7} fill={fill} />
      <Rect x={30} y={30} width={5.5} height={13} rx={2.7} fill={fill} />
      <Rect x={12.5} y={37} width={7.5} height={17} rx={3.5} fill={fill} />
      <Rect x={20} y={37} width={7.5} height={17} rx={3.5} fill={fill} />
      <Rect x={13} y={54.5} width={6} height={9} rx={2.7} fill={fill} />
      <Rect x={21} y={54.5} width={6} height={9} rx={2.7} fill={fill} />
      {/* musculo destacado */}
      {definition?.regions.map((region, i) => renderRegion(region, i, color))}
      {/* referencia frente/costas: linha da coluna nas costas */}
      {definition?.view === 'back' && <Path d="M20 14 L20 36" stroke={colors.card} strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />}
    </Svg>
  );
}
