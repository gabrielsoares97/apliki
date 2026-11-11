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
import { currentUserUsesGoogle, deleteAccount } from '../../firebase/auth';
import { GoogleSignInCancelled } from '../../firebase/googleAuth';
import { deleteAllUserData } from '../../db/reset';
import { deleteBillingData } from '../../firebase/billing';
import { cancelAllNotifications } from '../../notifications/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Exclusão definitiva da conta, confirmando a identidade de novo (senha ou conta Google). */
export function DeleteAccountModal({ visible, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  // Conta que entra só pelo Google não tem senha: a confirmação é pelo próprio Google.
  const viaGoogle = currentUserUsesGoogle();

  useEffect(() => {
    if (visible) setPassword('');
  }, [visible]);

  async function handleDelete() {
    if ((!viaGoogle && !password) || deleting) return;
    setDeleting(true);
    try {
      // Primeiro o servidor cancela a assinatura paga (se houver); só depois os dados e o login são apagados.
      await deleteAccount(password, async (uid) => {
        await deleteBillingData();
        await deleteAllUserData(uid);
      });
      await cancelAllNotifications();
      // O listener de autenticação leva o app de volta para a tela de login.
    } catch (error) {
      setDeleting(false);
      if (error instanceof GoogleSignInCancelled) return;
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
        Se quiser guardar uma cópia, exporte seus dados em PDF ou CSV antes. Se você tem uma assinatura paga, ela é
        cancelada agora e não haverá novas cobranças; valores já pagos não são reembolsados automaticamente.
      </Text>
      {viaGoogle ? (
        <Text style={styles.hint}>Para confirmar, o Google vai pedir que você escolha a sua conta de novo.</Text>
      ) : (
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
      )}
      <Button
        label={viaGoogle ? 'Confirmar com o Google e excluir' : 'Excluir minha conta'}
        variant="danger"
        loading={deleting}
        disabled={!viaGoogle && !password}
        onPress={handleDelete}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  warning: { ...typography.body, lineHeight: 20, marginBottom: spacing.sm },
  hint: { ...typography.label, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
});
