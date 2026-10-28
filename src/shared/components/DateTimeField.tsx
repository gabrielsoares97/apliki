/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, radius, spacing, typography } from '../theme';
import { formatDateTimePt } from '../date';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
          <Text style={styles.value}>{formatDateTimePt(value)}</Text>
        </Pressable>
      </View>
      <DateTimePickerFlow visible={showPicker} value={value} onConfirm={onChange} onClose={() => setShowPicker(false)} />
    </View>
  );
}

interface DateTimePickerFlowProps {
  visible: boolean;
  value: Date;
  /** Chamado uma vez, com data e hora ja combinadas. */
  onConfirm: (date: Date) => void;
  /** Chamado ao terminar (confirmando ou cancelando): quem abriu deve esconder o seletor. */
  onClose: () => void;
}

/**
 * Escolha de data + hora que funciona igual nas duas plataformas:
 * - Android nao tem o modo "datetime": abre o calendario e, escolhida a data, o relogio.
 * - iOS mostra o calendario com horario na propria tela e so aplica ao tocar em "Confirmar"
 *   (o seletor do iOS avisa a cada toque, entao fechar no primeiro aviso impedia escolher a hora).
 */
export function DateTimePickerFlow({ visible, value, onConfirm, onClose }: DateTimePickerFlowProps) {
  const [draft, setDraft] = useState(value);
  // O dialogo do Android chama de volta depois de alguns renders: usa sempre as funcoes mais recentes.
  const callbacks = useRef({ onConfirm, onClose });
  callbacks.current = { onConfirm, onClose };

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    if (Platform.OS !== 'android') return;

    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onValueChange: (_, selectedDate) => {
        const withDate = new Date(value);
        withDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        DateTimePickerAndroid.open({
          value: withDate,
          mode: 'time',
          is24Hour: true,
          onValueChange: (__, selectedTime) => {
            const merged = new Date(withDate);
            merged.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            callbacks.current.onConfirm(merged);
            callbacks.current.onClose();
          },
          // Cancelou so o horario: fica a data escolhida, no horario que ja estava.
          onDismiss: () => {
            callbacks.current.onConfirm(withDate);
            callbacks.current.onClose();
          },
        });
      },
      onDismiss: () => callbacks.current.onClose(),
    });
    // So reage a abertura: `value` muda depois do onConfirm e nao deve reabrir o dialogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || Platform.OS === 'android') return null;

  return (
    <View style={styles.iosPanel}>
      <DateTimePicker value={draft} mode="datetime" display="inline" locale="pt-BR" onValueChange={(_, selected) => setDraft(selected)} />
      <View style={styles.iosActions}>
        <Pressable style={styles.iosButton} onPress={onClose} hitSlop={8}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={styles.iosButton}
          onPress={() => {
            onConfirm(draft);
            onClose();
          }}
          hitSlop={8}
        >
          <Text style={styles.confirmText}>Confirmar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row' },
  field: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flex: 1,
  },
  value: { fontSize: 15, color: colors.textPrimary },
  iosPanel: { marginTop: spacing.xs },
  iosActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  iosButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  cancelText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  confirmText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
