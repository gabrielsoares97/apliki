/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { Linking, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextField } from '../../shared/components/TextField';
import { PasswordField } from '../../shared/components/PasswordField';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { MIN_PASSWORD_LENGTH, signUp } from '../../firebase/auth';
import { SITE_URL } from '../../firebase/api';
import { useAppStore } from '../../store/useAppStore';
import { GoogleButton, OrDivider } from './GoogleButton';
import { GOOGLE_SIGN_IN_AVAILABLE } from '../../firebase/googleAuth';

export function SignupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Preencha os campos', 'Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Senha muito curta', `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    setLoading(true);
    try {
      const user = await signUp(name, email, password);
      // Cria o perfil já com o nome certo aqui: o listener de autenticação (App.tsx) também
      // tentaria criar o perfil, mas pode disparar antes do updateProfile() propagar o nome.
      await useAppStore.getState().loadForUser(user.uid, name.trim());
      // A troca de tela acontece automaticamente pelo listener de autenticação.
    } catch (error) {
      Alert.alert('Não foi possível criar a conta', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={typography.title} accessibilityRole="header">
            Criar conta
          </Text>
          <Text style={styles.tagline}>7 dias grátis para testar tudo. Sem cartão.</Text>

          {GOOGLE_SIGN_IN_AVAILABLE && (
            <>
              <GoogleButton />
              <OrDivider />
            </>
          )}

          <TextField
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            maxLength={80}
            autoComplete="name"
            textContentType="name"
          />
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
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            onSubmitEditing={handleSignup}
          />

          <Button label="Criar conta grátis" onPress={handleSignup} loading={loading} style={{ marginTop: spacing.sm }} />
          <Button label="Já tenho conta" variant="ghost" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.xs }} />

          <Text style={styles.legal}>
            Ao criar a conta (por e-mail ou com o Google), você concorda com os{' '}
            <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(`${SITE_URL}/termos.html`)}>
              Termos de Uso
            </Text>{' '}
            e a{' '}
            <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(`${SITE_URL}/privacidade.html`)}>
              Política de Privacidade
            </Text>
            .
          </Text>
          <Text style={styles.disclaimer}>
            O apliKI é uma ferramenta de acompanhamento pessoal e não substitui orientação médica.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center', width: '100%', maxWidth: 440, alignSelf: 'center' },
  tagline: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  legal: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
  link: { color: colors.primary, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 16 },
});
