/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextField } from '../../shared/components/TextField';
import { PasswordField } from '../../shared/components/PasswordField';
import { Button } from '../../shared/components/Button';
import { colors, isDarkTheme, spacing, typography } from '../../shared/theme';
import { signIn } from '../../firebase/auth';
import { GoogleButton, OrDivider } from './GoogleButton';
import { GOOGLE_SIGN_IN_AVAILABLE } from '../../firebase/googleAuth';

// Logo com fundo transparente; no tema escuro usa a variante com o "apli" azul-marinho clareado para dar contraste.
const LOGO = isDarkTheme ? require('../../../assets/logo-dark.png') : require('../../../assets/logo.png');

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Preencha os campos', 'Informe e-mail e senha para entrar.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // A troca de tela acontece automaticamente pelo listener de autenticação.
    } catch (error) {
      Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="apliKI" />
          <Text style={styles.tagline}>Seu acompanhamento de tratamento, em um só lugar.</Text>

          {GOOGLE_SIGN_IN_AVAILABLE && (
            <>
              <GoogleButton />
              <OrDivider />
            </>
          )}

          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@email.com"
          />
          <PasswordField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            placeholder="••••••••"
            onSubmitEditing={handleLogin}
          />

          <Button label="Entrar" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.sm }} />

          <Button
            label="Esqueci minha senha"
            variant="ghost"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ marginTop: spacing.xs }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ainda não tem conta? Teste grátis por 7 dias, sem cartão.</Text>
            <Button label="Criar conta" variant="secondary" onPress={() => navigation.navigate('Signup')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  // No navegador a coluna não pode esticar pela tela toda: fica com largura de celular, centralizada.
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', width: '100%', maxWidth: 440, alignSelf: 'center' },
  logo: { width: 100, height: 118, alignSelf: 'center' },
  tagline: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  footer: { marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm },
  footerText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
});
