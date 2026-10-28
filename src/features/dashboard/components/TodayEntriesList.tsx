/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Alert } from '../../../shared/dialog';
import { Card } from '../../../shared/components/Card';
import { EmptyState } from '../../../shared/components/EmptyState';
import { IconButton } from '../../../shared/components/IconButton';
import { colors, spacing, typography } from '../../../shared/theme';
import { TodayEntry } from '../../../types';
import { deleteEntry } from '../todayService';
import { DoseFormModal } from '../../dose/DoseFormModal';
import { WeightFormModal } from '../../weight/WeightFormModal';
import { WaterFormModal } from '../../water/WaterFormModal';
import { MealFormModal } from '../../nutrition/MealFormModal';
import { ActivityFormModal } from '../../activity/ActivityFormModal';

const KIND_ICON: Record<TodayEntry['kind'], string> = {
  dose: '💉',
  weight: '⚖️',
  water: '💧',
  meal: '🍽️',
  activity: '🏃',
};

interface TodayEntriesListProps {
  entries: TodayEntry[];
  onChanged: () => void;
}

const COLLAPSED_LIMIT = 4;

export function TodayEntriesList({ entries, onChanged }: TodayEntriesListProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TodayEntry | null>(null);

  const visible = expanded ? entries : entries.slice(0, COLLAPSED_LIMIT);

  function handleDelete(entry: TodayEntry) {
    Alert.alert('Excluir registro', 'Tem certeza que deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entry.kind, entry.id);
          } catch {
            Alert.alert('Não foi possível excluir', 'Verifique sua conexão com a internet e tente de novo.');
          }
          onChanged();
        },
      },
    ]);
  }

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>Registros de hoje</Text>

      {entries.length === 0 && (
        <EmptyState
          icon="📝"
          title="Nenhum registro ainda hoje"
          description="Toque no botão + para registrar água, refeições, peso ou dose."
          style={styles.empty}
        />
      )}

      {visible.map((entry) => (
        <View key={`${entry.kind}-${entry.id}`} style={styles.row}>
          <Text style={styles.icon}>{KIND_ICON[entry.kind]}</Text>
          <Pressable
            style={styles.textWrap}
            onPress={() => setEditingEntry(entry)}
            accessibilityRole="button"
            accessibilityLabel={`${entry.title}, ${entry.subtitle}`}
            accessibilityHint="Abre o registro para editar"
          >
            <Text style={styles.title}>{entry.title}</Text>
            <Text style={styles.subtitle}>{entry.subtitle}</Text>
          </Pressable>
          <Pressable
            onPress={() => setEditingEntry(entry)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${entry.title}`}
          >
            <Text style={styles.edit}>Editar</Text>
          </Pressable>
          <IconButton icon="🗑️" iconSize={16} size={36} onPress={() => handleDelete(entry)} accessibilityLabel="Apagar registro" />
        </View>
      ))}

      {entries.length > COLLAPSED_LIMIT && (
        <Pressable onPress={() => setExpanded((v) => !v)} style={{ marginTop: spacing.xs }} hitSlop={10} accessibilityRole="button">
          <Text style={styles.more}>{expanded ? 'Ver menos' : `Ver mais (${entries.length - COLLAPSED_LIMIT})`}</Text>
        </Pressable>
      )}

      <DoseFormModal
        visible={editingEntry?.kind === 'dose'}
        editingDose={editingEntry?.kind === 'dose' ? (editingEntry.raw as any) : null}
        onClose={() => setEditingEntry(null)}
        onSaved={onChanged}
      />
      <WeightFormModal
        visible={editingEntry?.kind === 'weight'}
        editingWeight={editingEntry?.kind === 'weight' ? (editingEntry.raw as any) : null}
        onClose={() => setEditingEntry(null)}
        onSaved={onChanged}
      />
      <WaterFormModal
        visible={editingEntry?.kind === 'water'}
        editingWater={editingEntry?.kind === 'water' ? (editingEntry.raw as any) : null}
        onClose={() => setEditingEntry(null)}
        onSaved={onChanged}
      />
      <MealFormModal
        visible={editingEntry?.kind === 'meal'}
        editingMeal={editingEntry?.kind === 'meal' ? (editingEntry.raw as any) : null}
        onClose={() => setEditingEntry(null)}
        onSaved={onChanged}
      />
      <ActivityFormModal
        visible={editingEntry?.kind === 'activity'}
        editingActivity={editingEntry?.kind === 'activity' ? (editingEntry.raw as any) : null}
        onClose={() => setEditingEntry(null)}
        onSaved={onChanged}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs + 2, gap: spacing.sm },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  edit: { fontSize: 12, fontWeight: '700', color: colors.primary },
  empty: { paddingVertical: spacing.md },
  more: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
