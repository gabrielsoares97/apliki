/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, SwitchProps, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface ToggleRowProps {
  label: string;
  /** Explicacao curta abaixo do rotulo (ex.: "Avisa 1 hora antes da dose"). */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Linha "rotulo + descricao + Switch" com as cores da marca. A linha inteira e tocavel
 * e o leitor de tela anuncia rotulo, descricao e estado (ligado/desligado) de uma vez.
 */
export function ToggleRow({ label, description, value, onValueChange, disabled, style }: ToggleRowProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      style={[styles.row, disabled && styles.disabled, style]}
    >
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
      <BrandSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        // A linha ja anuncia o estado; evita que o leitor de tela pare duas vezes no mesmo controle.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

/**
 * Switch avulso com as cores da marca, para linhas em que tocar no texto faz outra coisa
 * (ex.: abrir a edicao de um lembrete). Passe sempre um `accessibilityLabel`.
 */
export function BrandSwitch({ value, ...rest }: SwitchProps) {
  return (
    <Switch
      value={value}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={Platform.OS === 'android' ? (value ? colors.white : colors.card) : undefined}
      ios_backgroundColor={colors.border}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  texts: { flex: 1 },
  label: { ...typography.body, fontSize: 15 },
  description: { ...typography.caption, marginTop: 2, lineHeight: 16 },
});
