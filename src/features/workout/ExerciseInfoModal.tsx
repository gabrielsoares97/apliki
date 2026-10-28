/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { IconButton } from '../../shared/components/IconButton';
import { colors, radius, shadow, spacing, typography } from '../../shared/theme';
import { Exercise } from '../../types';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../../shared/labels';
import { getExerciseImageUrls } from '../../shared/exerciseImages';

interface ExerciseInfoModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

/** Mostra como executar o exercicio: fotos das duas posicoes, passo a passo e dica. */
export function ExerciseInfoModal({ exercise, onClose }: ExerciseInfoModalProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded({});
    setFailed(false);
  }, [exercise?.id]);

  if (!exercise) return null;
  const images = getExerciseImageUrls(exercise.id);

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} accessibilityRole="header">{exercise.name}</Text>
              <Text style={styles.meta}>
                {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]}
              </Text>
            </View>
            <IconButton
              icon={<Text style={styles.closeText}>✕</Text>}
              onPress={onClose}
              accessibilityLabel="Fechar"
              size={30}
              style={styles.closeButton}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {images.length > 0 && !failed && (
              <View style={styles.imagesRow}>
                {images.map((uri, i) => (
                  <View key={uri} style={styles.imageBox}>
                    <Image
                      source={{ uri }}
                      style={styles.image}
                      resizeMode="cover"
                      onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                      onError={() => setFailed(true)}
                    />
                    {!loaded[i] && <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} />}
                    <Text style={styles.imageCaption}>{i === 0 ? 'Início' : 'Final'}</Text>
                  </View>
                ))}
              </View>
            )}
            {images.length > 0 && failed && (
              <Text style={styles.offline}>Não foi possível carregar as imagens. Verifique sua conexão.</Text>
            )}

            <Text style={styles.sectionLabel}>Como executar</Text>
            <Text style={styles.body}>{exercise.instructions}</Text>

            {!!exercise.tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {exercise.tip}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  meta: { ...typography.caption, marginTop: 2 },
  closeButton: { backgroundColor: colors.background },
  closeText: { color: colors.textSecondary, fontWeight: '700' },
  imagesRow: { flexDirection: 'row', gap: spacing.sm },
  imageBox: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.background },
  image: { width: '100%', aspectRatio: 1 },
  imageCaption: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  offline: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.md, marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  tipBox: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  tipText: { fontSize: 13, lineHeight: 19, color: colors.textPrimary },
});
