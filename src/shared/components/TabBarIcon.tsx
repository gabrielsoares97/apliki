/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

export type TabIconName = 'inicio' | 'nutricao' | 'treino' | 'doses' | 'perfil';

interface TabBarIconProps {
  name: TabIconName;
  /** Aba ativa: icone preenchido; inativa: so o contorno. */
  focused: boolean;
  color: string;
  size?: number;
}

/**
 * Icones da barra de abas desenhados em SVG (react-native-svg ja vem no projeto), para poderem ser
 * tingidos com a cor da aba. Emojis nao aceitam cor, entao a aba ativa so era indicada pelo texto.
 * Todos usam viewBox 24x24, traco de 1.8 no contorno e preenchimento na versao ativa.
 */
export function TabBarIcon({ name, focused, color, size = 24 }: TabBarIconProps) {
  const fill = focused ? color : 'none';
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'inicio' && (
        <Path d="M3.5 10.2 12 3.5l8.5 6.7V19.5a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2V21H5a1.5 1.5 0 0 1-1.5-1.5z" fill={fill} {...stroke} />
      )}

      {name === 'nutricao' && (
        <>
          {/* Tigela com uma folha saindo */}
          <Path d="M3 11.5h18a9 9 0 0 1-18 0z" fill={fill} {...stroke} />
          <Path d="M12 11.5c0-3.4 2.2-6.2 6-7.2-.2 3.6-2.4 6.2-6 7.2z" fill={fill} {...stroke} />
          <Path d="M8.5 11.5c-.4-1.9.3-3.6 1.8-4.6" fill="none" {...stroke} />
        </>
      )}

      {name === 'treino' && (
        <>
          {/* Halter */}
          <Line x1="8" y1="12" x2="16" y2="12" {...stroke} strokeWidth={2.2} />
          <Rect x="4.5" y="6" width="3.5" height="12" rx="1.2" fill={fill} {...stroke} />
          <Rect x="16" y="6" width="3.5" height="12" rx="1.2" fill={fill} {...stroke} />
          <Rect x="1.8" y="9" width="2.7" height="6" rx="1" fill={fill} {...stroke} />
          <Rect x="19.5" y="9" width="2.7" height="6" rx="1" fill={fill} {...stroke} />
        </>
      )}

      {name === 'doses' && (
        // Seringa inclinada a 45 graus
        <G transform="rotate(45 12 12)">
          <Rect x="9" y="6.5" width="6" height="10.5" rx="1.2" fill={fill} {...stroke} />
          <Line x1="12" y1="6.5" x2="12" y2="3" {...stroke} />
          <Line x1="9.5" y1="2.5" x2="14.5" y2="2.5" {...stroke} />
          <Line x1="12" y1="17" x2="12" y2="21.5" {...stroke} />
          {!focused && (
            <>
              <Line x1="9" y1="10" x2="11" y2="10" {...stroke} strokeWidth={1.4} />
              <Line x1="9" y1="13" x2="11" y2="13" {...stroke} strokeWidth={1.4} />
            </>
          )}
        </G>
      )}

      {name === 'perfil' && (
        <>
          <Circle cx="12" cy="8" r="4" fill={fill} {...stroke} />
          <Path d="M4 20.5c.6-4 3.9-6.5 8-6.5s7.4 2.5 8 6.5z" fill={fill} {...stroke} />
        </>
      )}
    </Svg>
  );
}
