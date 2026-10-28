/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, StyleSheet, ViewProps, Pressable } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
}

export function Card({ style, onPress, children, accessibilityRole, ...rest }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        // Card clicavel e lido como botao; o leitor de tela junta os textos internos como rotulo.
        accessibilityRole={accessibilityRole ?? 'button'}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[styles.card, style]} accessibilityRole={accessibilityRole} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow,
  },
  pressed: {
    opacity: 0.85,
  },
});
