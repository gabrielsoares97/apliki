/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

/**
 * Sinais visuais padronizados dos cards: quem ve o app precisa saber, sem tentar, o que e clicavel.
 * - CardLink: rodape "Ver ... ›" de todo card que abre outra tela ao ser tocado.
 * - CardAction: botao em formato de pilula para uma acao dentro do card (ex.: "+ Registrar").
 * Card sem nenhum dos dois e so informativo.
 */

export function CardLink({ label }: { label: string }) {
  // So visual: o card inteiro ja e o botao, e o leitor de tela le este rodape junto com ele.
  return (
    <View style={styles.link}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkChevron} importantForAccessibility="no" accessibilityElementsHidden>
        ›
      </Text>
    </View>
  );
}

interface CardActionProps {
  label: string;
  onPress: () => void;
  /** 'solid' para a acao principal do card, 'soft' para as demais. */
  variant?: 'solid' | 'soft';
  /** Texto lido pelo leitor de tela (ex.: "Registrar peso" quando o rotulo visivel e so "+ Registrar"). */
  accessibilityLabel?: string;
}

export function CardAction({ label, onPress, variant = 'soft', accessibilityLabel }: CardActionProps) {
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      // A pilula tem ~28px de altura: o hitSlop leva a area de toque para ~48px sem mudar o visual.
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.action, solid && styles.actionSolid, pressed && styles.pressed]}
    >
      <Text style={[styles.actionLabel, solid && styles.actionLabelSolid]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkLabel: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  linkChevron: { color: colors.primary, fontWeight: '700', fontSize: 20, lineHeight: 20 },
  action: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  actionSolid: { backgroundColor: colors.primary },
  actionLabel: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  actionLabelSolid: { color: colors.onPrimary },
  pressed: { opacity: 0.7 },
});
