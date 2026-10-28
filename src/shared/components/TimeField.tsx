/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing, typography } from '../theme';

interface TimeFieldProps {
  label: string;
  value: string; // "HH:mm" em 24h
  onChange: (value: string) => void;
}

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDisplay(time: string): string {
  return timeStringToDate(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Seletor de horário com rolagem (hora 1-12 + AM/PM, minutos de 5 em 5), em vez do teclado numérico padrão. */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={typography.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setShowPicker(true)}>
        <Text style={styles.value}>{formatDisplay(value)}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={timeStringToDate(value)}
          mode="time"
          display="spinner"
          is24Hour={false}
          minuteInterval={5}
          onChange={(event, selected) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (event.type === 'dismissed') return;
            if (selected) onChange(dateToTimeString(selected));
          }}
        />
      )}

      {showPicker && Platform.OS === 'ios' && (
        <Pressable style={styles.doneButton} onPress={() => setShowPicker(false)}>
          <Text style={styles.doneButtonText}>Concluído</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, gap: spacing.xs },
  field: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  value: { fontSize: 15, color: colors.textPrimary },
  doneButton: { alignSelf: 'flex-end', paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  doneButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
