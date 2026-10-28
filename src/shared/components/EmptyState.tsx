/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  /** Emoji (string) ou elemento exibido no topo, dentro de um circulo verde claro. */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Rotulo do botao de acao (ex.: "Registrar primeira dose"). So aparece junto com `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
  /** 'card' (padrao) para listas dentro de cards; 'screen' ocupa a tela toda, centralizado. */
  layout?: 'card' | 'screen';
  style?: ViewStyle;
}

/** Lista vazia com explicacao e, de preferencia, o proximo passo (ex.: "Nenhuma dose registrada ainda"). */
export function EmptyState({ icon, title, description, actionLabel, onAction, layout = 'card', style }: EmptyStateProps) {
  return (
    <View style={[styles.container, layout === 'screen' && styles.screen, style]}>
      {!!icon && (
        <View style={styles.iconWrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {typeof icon === 'string' ? <Text style={styles.iconText}>{icon}</Text> : icon}
        </View>
      )}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <Button label={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconText: { fontSize: 30 },
  title: { ...typography.subtitle, textAlign: 'center' },
  description: { ...typography.small, textAlign: 'center', lineHeight: 19, marginTop: spacing.xs, maxWidth: 320 },
  action: { marginTop: spacing.md },
});
