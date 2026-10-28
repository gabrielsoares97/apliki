/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, spacing } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { logWaterWithUndo } from '../../shared/quickActions';
import { DoseFormModal } from '../dose/DoseFormModal';
import { WeightFormModal } from '../weight/WeightFormModal';
import { MealFormModal } from '../nutrition/MealFormModal';
import { ActivityFormModal } from '../activity/ActivityFormModal';

type QuickAddKind = 'water' | 'meal' | 'weight' | 'dose' | 'activity' | 'workout';

interface Option {
  kind: QuickAddKind;
  label: string;
  hint?: string;
  icon: string;
}

const TAB_BAR_HEIGHT = 64;

/**
 * Botao "+" global (aparece em todas as abas). Agua registra com um toque, sem formulario;
 * o resto abre o formulario correspondente ou leva ao treino.
 */
export function QuickAddFab() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const cupSizeMl = useAppStore((s) => s.user?.cupSizeMl ?? 250);
  const bump = useAppStore((s) => s.bump);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<QuickAddKind | null>(null);

  const options: Option[] = [
    { kind: 'water', label: 'Água', hint: `+${cupSizeMl} ml com um toque`, icon: '💧' },
    { kind: 'meal', label: 'Refeição', icon: '🍽️' },
    { kind: 'weight', label: 'Peso', icon: '⚖️' },
    { kind: 'dose', label: 'Dose', icon: '💉' },
    { kind: 'activity', label: 'Atividade', icon: '🏃' },
    { kind: 'workout', label: 'Treino', hint: 'Abrir treino rápido', icon: '🏋️' },
  ];

  function handleSelect(kind: QuickAddKind) {
    setMenuOpen(false);
    if (kind === 'water') {
      logWaterWithUndo(bump);
    } else if (kind === 'workout') {
      navigation.navigate('TreinoTab', { screen: 'QuickWorkout' });
    } else {
      setActiveForm(kind);
    }
  }

  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + spacing.md;

  return (
    <>
      <Pressable style={[styles.fab, { bottom: fabBottom }]} onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="Adicionar registro">
        <Text style={styles.fabIcon} importantForAccessibility="no">+</Text>
      </Pressable>

      <Modal visible={menuOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} accessibilityLabel="Fechar menu">
          <View style={[styles.menu, { marginBottom: fabBottom + 58 + spacing.sm }]}>
            {options.map((opt) => (
              <Pressable
                key={opt.kind}
                style={styles.menuItem}
                onPress={() => handleSelect(opt.kind)}
                accessibilityRole="button"
                accessibilityLabel={opt.hint ? `${opt.label}, ${opt.hint}` : opt.label}
              >
                <Text style={styles.menuIcon}>{opt.icon}</Text>
                <View>
                  <Text style={styles.menuLabel}>{opt.label}</Text>
                  {!!opt.hint && <Text style={styles.menuHint}>{opt.hint}</Text>}
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <DoseFormModal visible={activeForm === 'dose'} onClose={() => setActiveForm(null)} />
      <WeightFormModal visible={activeForm === 'weight'} onClose={() => setActiveForm(null)} />
      <MealFormModal visible={activeForm === 'meal'} onClose={() => setActiveForm(null)} />
      <ActivityFormModal visible={activeForm === 'activity'} onClose={() => setActiveForm(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  fabIcon: { color: colors.onPrimary, fontSize: 30, fontWeight: '400', marginTop: -2 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'flex-end' },
  menu: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
    minWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, gap: spacing.md },
  menuIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuHint: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
