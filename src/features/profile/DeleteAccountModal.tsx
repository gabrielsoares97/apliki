/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { Button } from '../../shared/components/Button';
import { Alert } from '../../shared/dialog';
import { colors, spacing, typography } from '../../shared/theme';
import { deleteAccount } from '../../firebase/auth';
import { deleteAllUserData } from '../../db/reset';
import { cancelAllNotifications } from '../../notifications/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Exclusão definitiva da conta, pedindo a senha de novo para confirmar. */
export function DeleteAccountModal({ visible, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) setPassword('');
  }, [visible]);

  async function handleDelete() {
    if (!password || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(password, deleteAllUserData);
      await cancelAllNotifications();
      // O listener de autenticação leva o app de volta para a tela de login.
    } catch (error) {
      setDeleting(false);
      Alert.alert('Não foi possível excluir a conta', error instanceof Error ? error.message : 'Tente novamente.');
    }
  }

  return (
    <ModalSheet visible={visible} title="Excluir conta" onClose={deleting ? () => undefined : onClose}>
      <Text style={styles.warning}>
        Isso apaga para sempre sua conta e todos os seus registros: doses, pesos, fotos, água, refeições, treinos,
        lembretes e sintomas. Não dá para desfazer.
      </Text>
      <Text style={styles.hint}>
        Se quiser guardar uma cópia, exporte seus dados em PDF ou CSV antes. Assinaturas pagas não são reembolsadas
        automaticamente.
      </Text>
      <TextField
        label="Digite sua senha para confirmar"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        editable={!deleting}
      />
      <Button
        label={deleting ? 'Excluindo...' : 'Excluir minha conta'}
        variant="danger"
        disabled={!password || deleting}
        onPress={handleDelete}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  warning: { ...typography.body, lineHeight: 20, marginBottom: spacing.sm },
  hint: { ...typography.label, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
});
