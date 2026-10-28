/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { Chip } from '../../shared/components/Chip';
import { EmptyState } from '../../shared/components/EmptyState';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { searchExercises } from '../../shared/exerciseCatalog';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS } from '../../shared/labels';
import { Exercise, EquipmentType, MuscleGroup } from '../../types';

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];
const EQUIPMENT_TYPES = Object.keys(EQUIPMENT_LABELS) as EquipmentType[];

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Quando definido, trava o filtro de grupo muscular (ex: trocar exercício mantendo o mesmo grupo). */
  lockedMuscleGroup?: MuscleGroup | null;
  /** Quando definido, mostra o botão "Adicionar" em cada exercício. */
  onSelect?: (exercise: Exercise) => void;
}

export function ExercisePickerModal({ visible, onClose, title, lockedMuscleGroup, onSelect }: ExercisePickerModalProps) {
  const [query, setQuery] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(lockedMuscleGroup ?? null);
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = useMemo(
    () => searchExercises(query, lockedMuscleGroup ?? muscleGroup, equipment),
    [query, muscleGroup, equipment, lockedMuscleGroup]
  );

  return (
    <ModalSheet visible={visible} title={title ?? 'Biblioteca de exercícios'} onClose={onClose}>
      <TextField label="Buscar exercício" value={query} onChangeText={setQuery} placeholder="Ex: supino, agachamento..." />

      {!lockedMuscleGroup && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
          <View style={styles.chipRow}>
            <Chip label="Todos" selected={muscleGroup === null} onPress={() => setMuscleGroup(null)} />
            {MUSCLE_GROUPS.map((g) => (
              <Chip key={g} label={MUSCLE_GROUP_LABELS[g]} selected={muscleGroup === g} onPress={() => setMuscleGroup(muscleGroup === g ? null : g)} />
            ))}
          </View>
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={styles.chipRow}>
          <Chip label="Todo equipamento" selected={equipment === null} onPress={() => setEquipment(null)} />
          {EQUIPMENT_TYPES.map((eq) => (
            <Chip key={eq} label={EQUIPMENT_LABELS[eq]} selected={equipment === eq} onPress={() => setEquipment(equipment === eq ? null : eq)} />
          ))}
        </View>
      </ScrollView>

      {results.length === 0 && (
        <EmptyState icon="🔍" title="Nenhum exercício encontrado" description="Tente outro nome ou outro grupo muscular." />
      )}

      {results.map((exercise) => {
        const expanded = expandedId === exercise.id;
        return (
          <View key={exercise.id} style={styles.exerciseCard}>
            <Pressable
              style={styles.exerciseHeader}
              onPress={() => setExpandedId(expanded ? null : exercise.id)}
              accessibilityRole="button"
              accessibilityLabel={`${exercise.name}, ${MUSCLE_GROUP_LABELS[exercise.muscleGroup]}`}
              accessibilityState={{ expanded }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]}
                </Text>
              </View>
              <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
            </Pressable>

            {expanded && (
              <View style={styles.exerciseDetail}>
                <Text style={styles.detailLabel}>Como executar</Text>
                <Text style={styles.detailText}>{exercise.instructions}</Text>
                <Text style={[styles.detailLabel, { marginTop: spacing.xs }]}>Dica</Text>
                <Text style={styles.detailText}>💡 {exercise.tip}</Text>
              </View>
            )}

            {onSelect && (
              <Pressable
                style={styles.addButton}
                onPress={() => onSelect(exercise)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${exercise.name}`}
              >
                <Text style={styles.addButtonText}>+ Adicionar</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row' },
  exerciseCard: { backgroundColor: colors.background, borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  exerciseName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  exerciseMeta: { ...typography.caption, marginTop: 2 },
  expandIcon: { color: colors.textSecondary, fontSize: 12 },
  exerciseDetail: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  detailText: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  addButton: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: spacing.sm },
  addButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
});
