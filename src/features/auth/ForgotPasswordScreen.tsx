/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextField } from '../../shared/components/TextField';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { resetPassword } from '../../firebase/auth';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert('E-mail enviado', 'Confira sua caixa de entrada para redefinir a senha.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Não foi possível enviar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={typography.title}>Redefinir senha</Text>
          <Text style={[styles.tagline, { marginBottom: spacing.lg }]}>
            Enviaremos um link de redefinição para o seu e-mail cadastrado.
          </Text>

          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="voce@email.com"
          />

          <Button label="Enviar link" onPress={handleReset} loading={loading} style={{ marginTop: spacing.sm }} />
          <Button label="Voltar" variant="ghost" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.xs }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  tagline: { ...typography.body, color: colors.textSecondary },
});
