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
import { signUp } from '../../firebase/auth';
import { useAppStore } from '../../store/useAppStore';

export function SignupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Preencha os campos', 'Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha muito curta', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A confirmação de senha não confere.');
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
          <Text style={typography.title}>Criar conta</Text>
          <Text style={[styles.tagline, { marginBottom: spacing.lg }]}>Leva menos de um minuto.</Text>

          <TextField label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" maxLength={80} />
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@email.com"
          />
          <TextField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Mínimo 6 caracteres" />
          <TextField label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />

          <Button label="Criar conta" onPress={handleSignup} loading={loading} style={{ marginTop: spacing.sm }} />
          <Button label="Já tenho conta" variant="ghost" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.xs }} />

          <Text style={styles.disclaimer}>
            Este aplicativo é uma ferramenta de acompanhamento pessoal e não substitui orientação médica.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  tagline: { ...typography.body, color: colors.textSecondary },
  disclaimer: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});
