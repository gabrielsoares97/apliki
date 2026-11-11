/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Alert } from '../../shared/dialog';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { GoogleSignInCancelled, signInWithGoogle } from '../../firebase/googleAuth';

/** Logo "G" do Google nas cores oficiais (as diretrizes da marca pedem o logo sem alterações). */
function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <Path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
      <Path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </Svg>
  );
}

/**
 * "Continuar com Google": entra ou cria a conta de uma vez. A troca de tela acontece pelo listener de
 * autenticação (App.tsx), como no login por e-mail.
 */
export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      if (!(error instanceof GoogleSignInCancelled)) {
        Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Continuar com Google"
      accessibilityState={{ busy: loading, disabled: loading }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <View style={styles.row}>
          <GoogleLogo />
          <Text style={styles.label}>Continuar com Google</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Separador "ou" entre o botão do Google e o formulário de e-mail. */
export function OrDivider() {
  return (
    <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.line} />
      <Text style={styles.dividerText}>ou</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  label: { ...typography.button, color: colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption },
});
