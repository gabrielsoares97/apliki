/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressPhoto } from './ProgressPhoto';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { PhotoAngle, WeightLog } from '../../types';
import { formatShortDatePt } from '../../shared/date';

const ANGLES: { key: PhotoAngle; label: string }[] = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

function angleUri(log: WeightLog, angle: PhotoAngle): string | null {
  if (angle === 'front') return log.photoFrontUri;
  if (angle === 'side') return log.photoSideUri;
  return log.photoBackUri;
}

interface WeightDayDetailModalProps {
  log: WeightLog | null;
  onClose: () => void;
}

export function WeightDayDetailModal({ log, onClose }: WeightDayDetailModalProps) {
  return (
    <ModalSheet visible={log !== null} title={log ? formatShortDatePt(new Date(log.dateTime)) : ''} onClose={onClose}>
      {log && (
        <>
          <Text style={styles.weight}>{log.weightKg} kg</Text>
          {(log.waistCm || log.hipCm || log.armCm) && (
            <View style={styles.measurementsRow}>
              {log.waistCm && <Text style={styles.measurement}>Cintura: {log.waistCm}cm</Text>}
              {log.hipCm && <Text style={styles.measurement}>Quadril: {log.hipCm}cm</Text>}
              {log.armCm && <Text style={styles.measurement}>Braço: {log.armCm}cm</Text>}
            </View>
          )}
          <View style={styles.photoRow}>
            {ANGLES.map(({ key, label }) => {
              const uri = angleUri(log, key);
              return (
                <View key={key} style={styles.photoCol}>
                  <ProgressPhoto photoRef={uri} style={styles.photo} emptyLabel="Sem foto" />
                  <Text style={styles.photoLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  weight: { ...typography.big, color: colors.textPrimary, marginBottom: spacing.md },
  measurementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md, marginTop: -spacing.sm },
  measurement: { fontSize: 13, color: colors.textSecondary, backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  photoRow: { flexDirection: 'row', gap: spacing.sm },
  photoCol: { flex: 1, alignItems: 'center' },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.sm, backgroundColor: colors.background },
  photoLabel: { marginTop: spacing.xs, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
});
