/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { Button } from '../../shared/components/Button';
import { IconButton } from '../../shared/components/IconButton';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState, LoadingState } from '../../shared/components/ScreenState';
import { ProgressRing } from '../../shared/components/ProgressRing';
import { ProgressBar } from '../../shared/components/ProgressBar';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { mealRepository } from '../../db/repositories';
import { MealLog } from '../../types';
import { startOfDay, endOfDay, addDays, formatDatePt, isSameDay } from '../../shared/date';
import { MEAL_CATEGORY_LABELS } from '../../shared/labels';
import { MealFormModal } from './MealFormModal';

export function NutritionScreen() {
  const navigation = useNavigation<any>();
  const user = useAppStore((s) => s.user);
  const version = useAppStore((s) => s.version);
  const bump = useAppStore((s) => s.bump);

  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [favorites, setFavorites] = useState<MealLog[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);
  const [prefill, setPrefill] = useState<Partial<MealLog> | null>(null);
  // Carregando so ate a primeira resposta; recargas (foco/versao/dia) acontecem em segundo plano.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [dayMeals, favs] = await Promise.all([
        mealRepository.listBetween(startOfDay(date).toISOString(), endOfDay(date).toISOString()),
        mealRepository.listFavorites(),
      ]);
      setMeals(dayMeals);
      setFavorites(favs);
      setError(null);
    } catch {
      setError('Não foi possível carregar suas refeições. Verifique sua conexão e tente de novo.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  function openNewMeal() {
    setEditingMeal(null);
    setPrefill(null);
    setFormOpen(true);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, version])
  );

  const totals = useMemo(
    () => ({
      calories: meals.reduce((s, m) => s + m.calories, 0),
      protein: meals.reduce((s, m) => s + m.protein, 0),
      carb: meals.reduce((s, m) => s + m.carb, 0),
      fat: meals.reduce((s, m) => s + m.fat, 0),
      fiber: meals.reduce((s, m) => s + m.fiber, 0),
    }),
    [meals]
  );

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.title}>Nutrição</Text>

        <View style={styles.dateNav}>
          <IconButton
            icon={<Text style={styles.navArrow}>‹</Text>}
            onPress={() => setDate((d) => addDays(d, -1))}
            accessibilityLabel="Dia anterior"
            size={44}
          />
          <Text style={styles.dateLabel} accessibilityRole="header">
            {isSameDay(date, new Date()) ? 'Hoje' : formatDatePt(date)}
          </Text>
          <IconButton
            icon={<Text style={styles.navArrow}>›</Text>}
            onPress={() => setDate((d) => addDays(d, 1))}
            accessibilityLabel="Próximo dia"
            size={44}
          />
        </View>

        {loading ? (
          <LoadingState message="Carregando suas refeições..." fullScreen={false} style={styles.state} />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} fullScreen={false} style={styles.state} />
        ) : (
          <>
            <Card style={{ marginTop: spacing.sm }}>
              <View style={styles.summaryRow}>
                <ProgressRing progress={user.dailyCalorieGoal > 0 ? totals.calories / user.dailyCalorieGoal : 0} size={100} strokeWidth={10}>
                  <Text style={styles.ringValue}>{Math.round(totals.calories)}</Text>
                  <Text style={styles.ringLabel}>/ {user.dailyCalorieGoal} kcal</Text>
                </ProgressRing>
                <View style={{ flex: 1 }}>
                  <MacroRow label="Proteína" value={totals.protein} goal={user.dailyProteinGoal} color={colors.macroProtein} />
                  <MacroRow label="Carboidrato" value={totals.carb} goal={user.dailyCarbGoal} color={colors.macroCarb} />
                  <MacroRow label="Fibra" value={totals.fiber} goal={user.dailyFiberGoal} color={colors.macroFiber} />
                </View>
              </View>
              <Pressable
                onPress={() => navigation.navigate('NutritionGoals')}
                style={{ marginTop: spacing.sm }}
                hitSlop={12}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Criar/editar cardápio</Text>
              </Pressable>
            </Card>

            <Button label="+ Registrar refeição" onPress={openNewMeal} style={styles.addButton} />

            {favorites.length > 0 && (
              <>
                <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Refeições salvas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favorites.map((fav) => (
                    <Pressable
                      key={fav.id}
                      style={styles.favoriteChip}
                      onPress={() => {
                        setEditingMeal(null);
                        setPrefill({ ...fav, dateTime: new Date().toISOString() });
                        setFormOpen(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Registrar ${fav.name}, ${fav.calories} kcal`}
                    >
                      <Text style={styles.favoriteName}>{fav.name}</Text>
                      <Text style={styles.favoriteCalories}>{fav.calories} kcal</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={[typography.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Diário do dia</Text>
            {meals.length === 0 && (
              <Card>
                <EmptyState
                  icon="🍽️"
                  title="Nenhuma refeição registrada neste dia"
                  description="Toque em “Registrar refeição” para acompanhar calorias e macros do dia."
                />
              </Card>
            )}
            {meals.map((meal) => (
              <Pressable
                key={meal.id}
                onPress={() => {
                  setEditingMeal(meal);
                  setPrefill(null);
                  setFormOpen(true);
                }}
                accessibilityRole="button"
                accessibilityHint="Abre a refeição para editar"
              >
                <Card style={{ marginBottom: spacing.sm }}>
                  <View style={styles.mealRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealCategory}>{MEAL_CATEGORY_LABELS[meal.category]}</Text>
                      <Text style={typography.subtitle}>{meal.name}</Text>
                      <Text style={styles.detail}>
                        {meal.calories} kcal · P {meal.protein}g · C {meal.carb}g · G {meal.fat}g · F {meal.fiber}g
                      </Text>
                    </View>
                    {meal.isFavorite && <Text style={{ fontSize: 16 }}>⭐</Text>}
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <MealFormModal
        visible={formOpen}
        editingMeal={editingMeal}
        prefill={prefill}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          bump();
          load();
        }}
      />
    </SafeAreaView>
  );
}

function MacroRow({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <View style={{ marginBottom: spacing.xs + 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroLabel}>{Math.round(value)}/{goal}g</Text>
      </View>
      <ProgressBar progress={goal > 0 ? value / goal : 0} color={color} height={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  navArrow: { fontSize: 28, lineHeight: 32, color: colors.primary, fontWeight: '700' },
  dateLabel: { ...typography.subtitle, minWidth: 140, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ringValue: { ...typography.title },
  ringLabel: { fontSize: 11, color: colors.textSecondary },
  macroLabel: { ...typography.caption },
  link: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  addButton: { marginTop: spacing.md },
  state: { paddingVertical: spacing.xl },
  favoriteChip: { backgroundColor: colors.card, borderRadius: radius.smd, padding: spacing.sm, marginRight: spacing.sm, minWidth: 120, borderWidth: 1, borderColor: colors.border },
  favoriteName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  favoriteCalories: { ...typography.caption, marginTop: 2 },
  mealRow: { flexDirection: 'row', alignItems: 'center' },
  mealCategory: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase' },
  detail: { ...typography.caption, marginTop: 4 },
});
