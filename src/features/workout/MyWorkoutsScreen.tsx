/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ScreenState } from '../../shared/components/ScreenState';
import { PeekCarousel } from '../../shared/components/PeekCarousel';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { workoutTemplateRepository } from '../../db/repositories';
import { WorkoutTemplate } from '../../types';
import { totalTemplateSets } from '../../shared/workoutCalc';
import { getExerciseById } from '../../shared/exerciseCatalog';
import { MUSCLE_GROUP_EMOJI } from '../../shared/muscleEmoji';

export function MyWorkoutsScreen() {
  const navigation = useNavigation<any>();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await workoutTemplateRepository.listAll();
      setTemplates(all.sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch {
      setError('Não foi possível carregar seus treinos. Verifique sua conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleDelete(template: WorkoutTemplate) {
    Alert.alert('Excluir treino', `Excluir "${template.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await workoutTemplateRepository.remove(template.id); load(); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenState loading={loading} error={error} onRetry={retry} loadingMessage="Carregando seus treinos...">
        <ScrollView contentContainerStyle={styles.content}>
          <Button label="+ Novo treino" onPress={() => navigation.navigate('WorkoutBuilder')} />

          {templates.length === 0 && (
            <Card style={styles.workoutCard}>
              <EmptyState
                icon="📋"
                title="Nenhum treino salvo ainda"
                description="Crie um treino do zero com “Novo treino” ou comece por um programa pronto."
                actionLabel="Ver programas prontos"
                onAction={() => navigation.navigate('Programs')}
              />
            </Card>
          )}

          {templates.map((template) => {
            const expanded = expandedId === template.id;
            const firstExercise = getExerciseById(template.exercises[0]?.exerciseId);
            const emoji = firstExercise ? MUSCLE_GROUP_EMOJI[firstExercise.muscleGroup] : '🏋️';

            return (
              <Card key={template.id} style={styles.workoutCard}>
                <Pressable
                  style={styles.cardHeader}
                  onPress={() => setExpandedId(expanded ? null : template.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${template.name}, ${template.exercises.length} exercícios`}
                  accessibilityState={{ expanded }}
                >
                  <View style={styles.thumb}>
                    <Text style={styles.thumbEmoji}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.subtitle} numberOfLines={1}>{template.name}</Text>
                    <Text style={styles.meta}>
                      {template.exercises.length} exercícios · {totalTemplateSets(template)} séries
                    </Text>
                  </View>
                  <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
                </Pressable>

                {expanded && (
                  <View style={{ marginTop: spacing.md }}>
                    <PeekCarousel>
                      {template.exercises.map((te, i) => {
                        const exercise = getExerciseById(te.exerciseId);
                        return (
                          <View key={`${te.exerciseId}-${i}`} style={styles.exerciseTile}>
                            <Text style={styles.tileEmoji}>{exercise ? MUSCLE_GROUP_EMOJI[exercise.muscleGroup] : '🏋️'}</Text>
                            <Text style={styles.tileName} numberOfLines={2}>{exercise?.name ?? 'Exercício'}</Text>
                            <Text style={styles.tileMeta}>
                              {te.sets} × {te.reps} · {te.restSec}s
                            </Text>
                          </View>
                        );
                      })}
                    </PeekCarousel>

                    <View style={styles.actionsRow}>
                      <Pressable
                        style={styles.primaryAction}
                        onPress={() => navigation.navigate('ActiveWorkout', { template })}
                        accessibilityRole="button"
                        accessibilityLabel={`Iniciar ${template.name}`}
                      >
                        <Text style={styles.primaryActionText}>▶ Iniciar</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryAction}
                        onPress={() => navigation.navigate('WorkoutBuilder', { template })}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar ${template.name}`}
                      >
                        <Text style={styles.secondaryActionText}>Editar</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondaryAction}
                        onPress={() => handleDelete(template)}
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir ${template.name}`}
                      >
                        <Text style={[styles.secondaryActionText, { color: colors.danger }]}>Excluir</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      </ScreenState>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  workoutCard: { marginTop: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: { fontSize: 26 },
  chevron: { fontSize: 24, color: colors.textSecondary },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  meta: { ...typography.caption, marginTop: 2 },
  exerciseTile: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 110,
  },
  tileEmoji: { fontSize: 28 },
  tileName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  tileMeta: { ...typography.caption, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  // minHeight 44: area de toque confortavel.
  primaryAction: { flex: 1.4, minHeight: 44, justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 10, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryActionText: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
  secondaryAction: { flex: 1, minHeight: 44, justifyContent: 'center', backgroundColor: colors.background, borderRadius: 10, paddingVertical: spacing.sm, alignItems: 'center' },
  secondaryActionText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
