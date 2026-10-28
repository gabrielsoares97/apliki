/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from './theme';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
}

let queue: DialogRequest[] = [];
let listener: ((current: DialogRequest | null) => void) | null = null;

function emit() {
  listener?.(queue[0] ?? null);
}

/** Mesma assinatura do Alert.alert do React Native, mas com a identidade visual do app. */
function alert(title: string, message?: string, buttons?: DialogButton[]) {
  queue.push({ title, message, buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }] });
  if (queue.length === 1) emit();
}

export const Alert = { alert };

function dismissCurrent() {
  queue = queue.slice(1);
  emit();
}

export function DialogHost() {
  const [current, setCurrent] = useState<DialogRequest | null>(null);

  useEffect(() => {
    listener = setCurrent;
    setCurrent(queue[0] ?? null);
    return () => {
      listener = null;
    };
  }, []);

  if (!current) return null;

  const cancelButton = current.buttons.find((b) => b.style === 'cancel');
  const actionButtons = current.buttons.filter((b) => b !== cancelButton);
  // Botao principal por ultimo (mais proximo do polegar); cancelar fica como texto discreto.
  const ordered = cancelButton ? [...actionButtons, cancelButton] : actionButtons;

  function press(button: DialogButton) {
    dismissCurrent();
    button.onPress?.();
  }

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={() => press(cancelButton ?? current!.buttons[0])}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {current.title}
          </Text>
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}

          <View style={styles.buttons}>
            {ordered.map((button, i) => {
              const isCancel = button === cancelButton;
              const isDestructive = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text}-${i}`}
                  onPress={() => press(button)}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? styles.buttonGhost : isDestructive ? styles.buttonDanger : styles.buttonPrimary,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel ? styles.buttonTextGhost : isDestructive ? styles.buttonTextOnDanger : styles.buttonTextOnPrimary,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  message: { fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginTop: spacing.sm },
  buttons: { marginTop: spacing.lg, gap: spacing.sm },
  button: { minHeight: 48, paddingVertical: spacing.sm + 4, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonTextOnPrimary: { color: colors.onPrimary },
  buttonTextOnDanger: { color: colors.onDanger },
  buttonTextGhost: { color: colors.textSecondary },
});
