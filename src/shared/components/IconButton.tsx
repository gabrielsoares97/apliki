/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

type IconButtonVariant = 'plain' | 'tinted' | 'danger';

interface IconButtonProps {
  /** Emoji/simbolo (string) ou elemento (ex.: um icone SVG). */
  icon: React.ReactNode;
  onPress: () => void;
  /** Obrigatorio: botao so com icone nao tem texto para o leitor de tela (ex.: "Excluir registro"). */
  accessibilityLabel: string;
  /** Explica o que acontece ao tocar, quando nao for obvio (ex.: "Abre a lista de lembretes"). */
  accessibilityHint?: string;
  /** 'plain' (padrao) sem fundo; 'tinted' com fundo verde claro; 'danger' para acoes destrutivas. */
  variant?: IconButtonVariant;
  disabled?: boolean;
  /** Lado do quadrado visivel; a area de toque nunca fica menor que 44x44. */
  size?: number;
  /** Tamanho do emoji/simbolo quando `icon` e string. */
  iconSize?: number;
  style?: ViewStyle;
}

const MIN_TOUCH = 44;

/** Botao quadrado so com icone (lixeira, editar, fechar...), com area de toque acessivel. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'plain',
  disabled,
  size = 36,
  iconSize = 18,
  style,
}: IconButtonProps) {
  // Se o visual for menor que 44, o hitSlop completa a area de toque.
  const slop = Math.max(0, Math.ceil((MIN_TOUCH - size) / 2));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {typeof icon === 'string' ? (
        <Text style={{ fontSize: iconSize, color: ICON_BUTTON_COLORS[variant] }} importantForAccessibility="no">
          {icon}
        </Text>
      ) : (
        icon
      )}
    </Pressable>
  );
}

/** Cor sugerida para icones SVG/elementos passados em `icon`, por variante. */
export const ICON_BUTTON_COLORS: Record<IconButtonVariant, string> = {
  plain: colors.textSecondary,
  tinted: colors.primary,
  danger: colors.danger,
};

const styles = StyleSheet.create({
  base: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.4 },
});

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  plain: { backgroundColor: 'transparent' },
  tinted: { backgroundColor: colors.primaryLight },
  danger: { backgroundColor: 'transparent' },
};
