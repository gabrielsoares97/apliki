/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInputProps, View } from 'react-native';
import { TextField } from './TextField';
import { colors, spacing } from '../theme';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
}

/** Campo de senha com "Mostrar/Ocultar": dispensa o campo de confirmação sem aumentar os erros de digitação. */
export function PasswordField({ label, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TextField label={label} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} {...rest} />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Alinhado à linha do rótulo, à direita, para não disputar espaço com o texto digitado.
  toggle: { position: 'absolute', right: 0, top: 0, paddingHorizontal: spacing.xs },
  toggleText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
