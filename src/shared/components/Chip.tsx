/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Cor de fundo quando selecionado. Precisa ter contraste com `colors.onPrimary` (texto por cima). */
  color?: string;
  /** Texto lido pelo leitor de tela, quando o rotulo visivel nao basta. */
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, color = colors.primary, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      // Chip e baixo (~32px): o hitSlop completa a area de toque ate ~44px sem mudar o visual.
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? color : colors.border, backgroundColor: selected ? color : colors.card },
        pressed && !!onPress && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  label: { fontSize: 13, fontWeight: '600' },
});
