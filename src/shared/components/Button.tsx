/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Mostra um indicador de carregamento no lugar do rotulo e bloqueia novos toques. */
  loading?: boolean;
  /** 'md' (padrao) para acoes principais; 'sm' para acoes secundarias dentro de cards/linhas. */
  size?: 'md' | 'sm';
  /** Emoji (string) ou elemento exibido antes do rotulo. */
  icon?: React.ReactNode;
  /** Texto lido pelo leitor de tela, quando o rotulo visivel nao basta. */
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  size = 'md',
  icon,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const inactive = !!disabled || !!loading;
  const textColor = LABEL_COLORS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {typeof icon === 'string' ? (
            <Text style={[styles.icon, size === 'sm' && styles.iconSm]}>{icon}</Text>
          ) : (
            icon
          )}
          <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const LABEL_COLORS: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  secondary: colors.textPrimary,
  ghost: colors.textPrimary,
  danger: colors.onDanger,
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Altura minima de 44 garante area de toque confortavel (diretriz de acessibilidade).
  sizeMd: { minHeight: 44, paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg },
  sizeSm: { minHeight: 44, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.smd },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { ...typography.button, textAlign: 'center' },
  labelSm: { fontSize: 14 },
  icon: { fontSize: 17 },
  iconSm: { fontSize: 15 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
};
