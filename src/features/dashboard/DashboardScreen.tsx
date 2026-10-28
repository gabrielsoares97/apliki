/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { CardAction } from '../../shared/components/CardParts';
import { LoadingState } from '../../shared/components/ScreenState';
import { HeaderGreeting } from './components/HeaderGreeting';
import { OnboardingChecklist, ChecklistItem } from './components/OnboardingChecklist';
import { NextDoseCard } from './components/NextDoseCard';
import { WeightCard } from './components/WeightCard';
import { WaterCard } from './components/WaterCard';
import { NutritionCard } from './components/NutritionCard';
import { ActivityCard } from './components/ActivityCard';
import { TodayEntriesList } from './components/TodayEntriesList';
import { AchievementsRow } from './components/AchievementsRow';
import { EloCard } from './components/EloCard';
import { FocusCard } from './components/FocusCard';
import { FocusItem, getFocusItems } from './focus';
import { logWaterWithUndo } from '../../shared/quickActions';
import { DoseFormModal } from '../dose/DoseFormModal';
import { WeightFormModal } from '../weight/WeightFormModal';
import { ActivityFormModal } from '../activity/ActivityFormModal';
import { getAllEntryDateKeys, computeStreak, getTodayEntries, getTodayTotals, DailyTotals } from './todayService';
import { computeAchievements } from './achievements';
import { getEloProgress } from './eloService';
import { EloProgress } from '../../shared/eloCalc';
import { doseRepository, activityRepository, reminderRepository } from '../../db/repositories';
import { DashboardCardId, DoseLog, TodayEntry, WaterLog } from '../../types';
import { startOfDay, addDays, dateKeyOfIso } from '../../shared/date';

const DEFAULT_ORDER: DashboardCardId[] = ['nextDose', 'weight', 'water', 'nutrition', 'activity'];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const user = useAppStore((s) => s.user);
  const medication = useAppStore((s) => s.medication);
  const patchUser = useAppStore((s) => s.patchUser);
  const patchMedication = useAppStore((s) => s.patchMedication);
  const bump = useAppStore((s) => s.bump);
  const version = useAppStore((s) => s.version);

  const [streak, setStreak] = useState(0);
  const [lastDose, setLastDose] = useState<DoseLog | null>(null);
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [todayWaterLogs, setTodayWaterLogs] = useState<WaterLog[]>([]);
  const [totals, setTotals] = useState<DailyTotals | null>(null);
  const [weekActivityDateKeys, setWeekActivityDateKeys] = useState<Set<string>>(new Set());
  const [hasReminder, setHasReminder] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [quickDoseOpen, setQuickDoseOpen] = useState(false);
  const [quickWeightOpen, setQuickWeightOpen] = useState(false);
  const [quickActivityOpen, setQuickActivityOpen] = useState(false);
  const [eloProgress, setEloProgress] = useState<EloProgress | null>(null);

  // Cada carga recebe um numero: se outra comecou depois (ex.: dois registros seguidos), a resposta
  // atrasada da anterior e descartada em vez de sobrescrever dados mais novos.
  const loadRequestRef = useRef(0);

  const loadData = useCallback(async () => {
    const request = ++loadRequestRef.current;
    const isCurrent = () => request === loadRequestRef.current;
    try {
      const weekStart = addDays(startOfDay(new Date()), -6);
      const [dateKeys, entries, dailyTotals, doses, activities, reminders] = await Promise.all([
        getAllEntryDateKeys(),
        getTodayEntries(),
        getTodayTotals(),
        doseRepository.listAll(),
        activityRepository.listBetween(weekStart.toISOString(), new Date().toISOString()),
        reminderRepository.listAll(),
      ]);
      if (!isCurrent()) return;
      setStreak(computeStreak(dateKeys));
      setTodayEntries(entries);
      setTotals(dailyTotals);
      setLastDose(doses[0] ?? null);
      setTodayWaterLogs(entries.filter((e) => e.kind === 'water').map((e) => e.raw as WaterLog));
      setWeekActivityDateKeys(new Set(activities.map((a) => dateKeyOfIso(a.dateTime))));
      setHasReminder(reminders.length > 0);
    } catch (error) {
      // Sem conexao a tela continua com os ultimos dados; a proxima volta para ela tenta de novo.
      console.warn('[dashboard] não foi possível carregar os dados de hoje.', error);
    }

    getEloProgress()
      .then((progress) => {
        if (isCurrent()) setEloProgress(progress);
      })
      .catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, version])
  );

  const checklistItems: ChecklistItem[] = useMemo(() => {
    const hasDose = todayEntries.some((e) => e.kind === 'dose') || !!lastDose;
    const hasWeightToday = todayEntries.some((e) => e.kind === 'weight');
    const hasMeal = todayEntries.some((e) => e.kind === 'meal');
    return [
      { key: 'dose', label: 'Registrar primeira dose', done: hasDose, onPress: () => setQuickDoseOpen(true) },
      { key: 'weight', label: 'Registrar peso de hoje', done: hasWeightToday, onPress: () => setQuickWeightOpen(true) },
      { key: 'meal', label: 'Registrar primeira refeição', done: hasMeal, onPress: () => navigation.navigate('NutricaoTab') },
      { key: 'reminder', label: 'Criar primeiro lembrete', done: hasReminder, onPress: () => navigation.navigate('DosesTab', { screen: 'SupplementReminders' }) },
      { key: 'menu', label: 'Montar cardápio inicial', done: user?.nutritionGoalsSet ?? false, onPress: () => navigation.navigate('NutricaoTab', { screen: 'NutritionGoals' }) },
    ];
  }, [todayEntries, lastDose, user, navigation, hasReminder]);

  const showOnboarding = !!user && !user.onboardingDismissed && checklistItems.filter((i) => i.done).length < checklistItems.length;

  const achievements = useMemo(
    () => computeAchievements(streak, user?.startWeightKg ?? null, user?.currentWeightKg ?? null),
    [streak, user?.startWeightKg, user?.currentWeightKg]
  );

  const focusItems = useMemo(
    () =>
      user
        ? getFocusItems({
            now: new Date(),
            nextDoseAt: medication?.nextDoseAt ?? null,
            doseLoggedToday: todayEntries.some((e) => e.kind === 'dose'),
            waterConsumedMl: todayWaterLogs.reduce((sum, log) => sum + log.amountMl, 0),
            waterGoalMl: user.dailyWaterGoalMl,
            cupSizeMl: user.cupSizeMl,
            weightLoggedToday: todayEntries.some((e) => e.kind === 'weight'),
            mealLoggedToday: todayEntries.some((e) => e.kind === 'meal'),
          })
        : [],
    [user, medication?.nextDoseAt, todayEntries, todayWaterLogs]
  );

  function handleFocusAction(item: FocusItem) {
    switch (item.key) {
      case 'dose':
        setQuickDoseOpen(true);
        break;
      case 'water':
        logWaterWithUndo(bump);
        break;
      case 'weight':
        setQuickWeightOpen(true);
        break;
      case 'meal':
        navigation.navigate('NutricaoTab');
        break;
    }
  }

  const [order, setOrder] = useState<DashboardCardId[]>(DEFAULT_ORDER);
  React.useEffect(() => {
    if (!user) return;
    try {
      const parsed = JSON.parse(user.dashboardOrder) as DashboardCardId[];
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) setOrder(parsed);
    } catch {
      setOrder(DEFAULT_ORDER);
    }
  }, [user]);

  async function persistOrder(newOrder: DashboardCardId[]) {
    setOrder(newOrder);
    await patchUser({ dashboardOrder: JSON.stringify(newOrder) });
  }

  function moveCard(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function renderCard(cardId: DashboardCardId) {
    if (!user) return null;
    switch (cardId) {
      case 'nextDose':
        return medication ? (
          <NextDoseCard
            medication={medication}
            lastDose={lastDose}
            onPress={() => navigation.navigate('DosesTab')}
            onRegisterDose={() => setQuickDoseOpen(true)}
            onChangeDate={async (date) => {
              await patchMedication({ nextDoseAt: date.toISOString() });
              bump();
            }}
          />
        ) : null;
      case 'weight':
        return (
          <WeightCard
            currentWeightKg={user.currentWeightKg}
            goalWeightKg={user.goalWeightKg}
            onAdd={() => setQuickWeightOpen(true)}
            onPress={() => navigation.navigate('InicioTab', { screen: 'WeightDetail' })}
          />
        );
      case 'water':
        return (
          <WaterCard goalMl={user.dailyWaterGoalMl} cupSizeMl={user.cupSizeMl} todayLogs={todayWaterLogs}
            onChanged={() => { bump(); }}
            onOpenReminders={() => navigation.navigate('PerfilTab', { screen: 'WaterReminders', initial: false })}
          />
        );
      case 'nutrition':
        return totals ? (
          <NutritionCard
            calories={totals.calories}
            protein={totals.protein}
            carb={totals.carb}
            fiber={totals.fiber}
            calorieGoal={user.dailyCalorieGoal}
            proteinGoal={user.dailyProteinGoal}
            carbGoal={user.dailyCarbGoal}
            fiberGoal={user.dailyFiberGoal}
            onPress={() => navigation.navigate('NutricaoTab')}
            onEditGoals={() => navigation.navigate('NutricaoTab', { screen: 'NutritionGoals', initial: false })}
          />
        ) : null;
      case 'activity':
        return (
          <ActivityCard
            todayCalories={totals?.activityCalories ?? 0}
            weekActivityDateKeys={weekActivityDateKeys}
            onAdd={() => setQuickActivityOpen(true)}
          />
        );
      default:
        return null;
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Carregando seu painel..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <HeaderGreeting name={user.name} streak={streak} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {showOnboarding && (
          <OnboardingChecklist items={checklistItems} onDismiss={() => patchUser({ onboardingDismissed: true })} />
        )}

        <FocusCard items={focusItems} onAction={handleFocusAction} />

        <Text style={styles.sectionTitle}>Seu progresso</Text>
        <EloCard progress={eloProgress} onPress={() => navigation.navigate('EloDetail')} />

        <AchievementsRow achievements={achievements} />

        <View style={styles.reorderRow}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Acompanhamento de hoje</Text>
          <CardAction label={reordering ? 'Concluir' : 'Mudar ordem'} onPress={() => setReordering((v) => !v)} />
        </View>

        {order.map((cardId, index) => (
          <View key={cardId} style={styles.cardSlot}>
            {reordering && (
              <View style={styles.moveRow}>
                <Pressable
                  style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                  onPress={() => moveCard(index, -1)}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Subir este card"
                  accessibilityState={{ disabled: index === 0 }}
                >
                  <Text style={styles.moveButtonText}>▲ Subir</Text>
                </Pressable>
                <Pressable
                  style={[styles.moveButton, index === order.length - 1 && styles.moveButtonDisabled]}
                  onPress={() => moveCard(index, 1)}
                  disabled={index === order.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel="Descer este card"
                  accessibilityState={{ disabled: index === order.length - 1 }}
                >
                  <Text style={styles.moveButtonText}>▼ Descer</Text>
                </Pressable>
              </View>
            )}
            {renderCard(cardId)}
          </View>
        ))}

        <TodayEntriesList entries={todayEntries} onChanged={() => bump()} />
      </ScrollView>

      <DoseFormModal visible={quickDoseOpen} onClose={() => setQuickDoseOpen(false)} onSaved={() => bump()} />
      <WeightFormModal visible={quickWeightOpen} onClose={() => setQuickWeightOpen(false)} onSaved={() => bump()} />
      <ActivityFormModal visible={quickActivityOpen} onClose={() => setQuickActivityOpen(false)} onSaved={() => bump()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  reorderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.3, marginBottom: spacing.sm },
  cardSlot: { marginBottom: spacing.md },
  moveRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  // Altura minima de 44 para a area de toque ficar confortavel.
  moveButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.primaryLight },
  moveButtonDisabled: { opacity: 0.4 },
  moveButtonText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
});
