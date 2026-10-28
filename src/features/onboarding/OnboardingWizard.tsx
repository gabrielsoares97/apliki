/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { TextField } from '../../shared/components/TextField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { IconButton } from '../../shared/components/IconButton';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { BmiGauge } from '../../shared/components/BmiGauge';
import { getBmiCategory } from '../../shared/bmi';
import { useAppStore } from '../../store/useAppStore';
import { createMedication } from '../../db/repositories/medicationRepository';
import { ActivityLevel, Sex, TreatmentStage } from '../../types';
import {
  calculateNutritionGoals,
  ACTIVITY_LEVEL_LABELS,
  SEX_LABELS,
  SEX_OPTIONS,
  ACTIVITY_OPTIONS,
  PACE_OPTIONS,
} from '../../shared/nutritionCalc';
import { addDays } from '../../shared/date';

const MOTIVATION_OPTIONS = [
  'Me sentir mais confiante',
  'Ter mais disposição e energia',
  'Melhorar meus exames',
  'Voltar a usar roupas que eu gosto',
  'Ter um evento especial chegando',
  'Melhorar o sono',
];

// Medicamentos GLP-1/tirzepatida mais usados no Brasil para este tipo de tratamento.
const MEDICATION_OPTIONS = ['Ozempic', 'Mounjaro', 'Tirzepatida', 'Wegovy', 'Saxenda', 'Trulicity'];
const OTHER_OPTION_LABEL = 'Outro';

interface FrequencyOption {
  label: string;
  days: number | null; // null = "Outro" (usuário digita)
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { label: 'Diariamente', days: 1 },
  { label: 'Semanalmente', days: 7 },
  { label: 'A cada duas semanas', days: 14 },
  { label: 'Mensalmente', days: 30 },
  { label: 'Outro', days: null },
  { label: 'Ainda não sei', days: 7 },
];

interface Draft {
  treatmentStage: TreatmentStage | null;
  sex: Sex | null;
  age: string;
  heightCm: string;
  currentWeightKg: string;
  goalWeightKg: string;
  activityLevel: ActivityLevel | null;
  weeklyPaceGoalKg: number;
  motivations: string[];
  medNameOption: string;
  medName: string;
  medDoseMg: string;
  medFrequencyLabel: string;
  medFrequencyDays: string;
  nextDoseAt: Date;
}

const TOTAL_STEPS = 12;

export function OnboardingWizard() {
  const existingUser = useAppStore((s) => s.user);
  const patchUser = useAppStore((s) => s.patchUser);
  const refreshMedication = useAppStore((s) => s.refreshMedication);
  const bump = useAppStore((s) => s.bump);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    treatmentStage: existingUser?.treatmentStage ?? null,
    sex: existingUser?.sex ?? null,
    age: existingUser?.age ? String(existingUser.age) : '',
    heightCm: existingUser?.heightCm ? String(existingUser.heightCm) : '',
    currentWeightKg: existingUser?.currentWeightKg ? String(existingUser.currentWeightKg) : '',
    goalWeightKg: existingUser?.goalWeightKg ? String(existingUser.goalWeightKg) : '',
    activityLevel: existingUser?.activityLevel ?? null,
    weeklyPaceGoalKg: existingUser?.weeklyPaceGoalKg ?? 0.5,
    motivations: existingUser?.motivations ?? [],
    medNameOption: '',
    medName: '',
    medDoseMg: '',
    medFrequencyLabel: '',
    medFrequencyDays: '7',
    nextDoseAt: addDays(new Date(), 7),
  });

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const age = parseInt(draft.age, 10) || 0;
  // Teclado decimal em pt-BR digita virgula ("84,6").
  const heightCm = parseFloat(draft.heightCm.replace(',', '.')) || 0;
  const currentWeightKg = parseFloat(draft.currentWeightKg.replace(',', '.')) || 0;
  const goalWeightKg = parseFloat(draft.goalWeightKg.replace(',', '.')) || 0;
  const bmi = heightCm > 0 && currentWeightKg > 0 ? currentWeightKg / (heightCm / 100) ** 2 : null;

  const preview = useMemo(() => {
    if (!heightCm || !currentWeightKg || !age) return null;
    return calculateNutritionGoals({
      sex: draft.sex,
      age,
      heightCm,
      currentWeightKg,
      activityLevel: draft.activityLevel,
      weeklyPaceGoalKg: draft.weeklyPaceGoalKg,
    });
  }, [draft.sex, draft.activityLevel, draft.weeklyPaceGoalKg, age, heightCm, currentWeightKg]);

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return draft.treatmentStage !== null;
      case 1:
        return draft.sex !== null;
      case 2:
        return age > 0;
      case 3:
        return heightCm > 0;
      case 4:
        return currentWeightKg > 0;
      case 5:
        return goalWeightKg > 0;
      case 6:
        return draft.activityLevel !== null;
      case 7:
        return true;
      case 8:
        return true;
      case 9:
        return draft.medName.trim().length > 0 && (parseFloat(draft.medDoseMg.replace(',', '.')) || 0) > 0;
      case 10: {
        const selectedFrequency = FREQUENCY_OPTIONS.find((f) => f.label === draft.medFrequencyLabel);
        if (!selectedFrequency) return false;
        if (selectedFrequency.days === null) return (parseInt(draft.medFrequencyDays, 10) || 0) > 0;
        return true;
      }
      case 11:
        return true;
      default:
        return false;
    }
  }

  function goNext() {
    if (!canContinue()) {
      Alert.alert('Faltou preencher', 'Complete esta etapa para continuar.');
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function toggleMotivation(label: string) {
    setDraft((prev) => ({
      ...prev,
      motivations: prev.motivations.includes(label) ? prev.motivations.filter((m) => m !== label) : [...prev.motivations, label],
    }));
  }

  async function finish() {
    if (!preview || saving) return;
    setSaving(true);
    try {
      // Medicamento primeiro: `onboardingCompleted` fecha o assistente, entao so e gravado quando todo o
      // resto deu certo. Se algo falhar, a pessoa continua aqui e pode tentar de novo (gravar de novo o
      // mesmo medicamento so o sobrescreve).
      await createMedication({
        name: draft.medName.trim(),
        defaultDoseMg: parseFloat(draft.medDoseMg.replace(',', '.')) || 0,
        frequencyDays: parseInt(draft.medFrequencyDays, 10) || 7,
        preferredReminderTime: '08:00',
        nextDoseAt: draft.nextDoseAt.toISOString(),
        dosesPerPen: null,
        penDosesRemaining: null,
      });
      await refreshMedication();

      await patchUser({
        treatmentStage: draft.treatmentStage,
        sex: draft.sex,
        age,
        heightCm,
        startWeightKg: currentWeightKg,
        currentWeightKg,
        goalWeightKg,
        activityLevel: draft.activityLevel,
        weeklyPaceGoalKg: draft.weeklyPaceGoalKg,
        motivations: draft.motivations,
        dailyCalorieGoal: preview.calories,
        dailyProteinGoal: preview.protein,
        dailyCarbGoal: preview.carb,
        dailyFatGoal: preview.fat,
        dailyFiberGoal: preview.fiber,
        nutritionGoalsSet: true,
        onboardingCompleted: true,
      });
      bump();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão com a internet e toque em "Começar minha jornada" de novo.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          {step > 0 ? (
            <IconButton icon={<Text style={styles.backArrow}>‹</Text>} onPress={goBack} accessibilityLabel="Voltar" size={32} />
          ) : (
            <View style={{ width: 32 }} />
          )}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <StepShell title="Em que momento do tratamento você está?" subtitle="Vamos personalizar o app para esta fase.">
              <OptionRow
                title="Já estou aplicando o medicamento"
                selected={draft.treatmentStage === 'aplicando'}
                onPress={() => update('treatmentStage', 'aplicando')}
              />
              <OptionRow
                title="Ainda não comecei"
                selected={draft.treatmentStage === 'nao_comecei'}
                onPress={() => update('treatmentStage', 'nao_comecei')}
              />
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Como você se identifica?" subtitle="Isso ajuda a calcular suas metas nutricionais com mais precisão.">
              {SEX_OPTIONS.map((s) => (
                <OptionRow key={s} title={SEX_LABELS[s]} selected={draft.sex === s} onPress={() => update('sex', s)} />
              ))}
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Qual sua idade?" subtitle="">
              <TextField label="Idade" keyboardType="number-pad" value={draft.age} onChangeText={(v) => update('age', v)} placeholder="Ex: 34" />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Qual sua altura?" subtitle="">
              <TextField label="Altura (cm)" keyboardType="decimal-pad" value={draft.heightCm} onChangeText={(v) => update('heightCm', v)} placeholder="Ex: 165" />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Qual seu peso atual?" subtitle="">
              <TextField
                label="Peso atual (kg)"
                keyboardType="decimal-pad"
                value={draft.currentWeightKg}
                onChangeText={(v) => update('currentWeightKg', v)}
                placeholder="Ex: 92"
              />
              {bmi && (
                <View style={[styles.infoBox, styles.bmiBox]}>
                  <View style={styles.infoBoxHeader}>
                    <Text style={styles.infoLabel}>IMC</Text>
                    <Text style={styles.infoValue}>{bmi.toFixed(1)}</Text>
                  </View>
                  <Text style={[styles.bmiCategory, { color: getBmiCategory(bmi).color }]}>{getBmiCategory(bmi).label}</Text>
                  <BmiGauge bmi={bmi} />
                </View>
              )}
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="Qual sua meta de peso?" subtitle="Você poderá alterar depois, se quiser.">
              <TextField
                label="Peso meta (kg)"
                keyboardType="decimal-pad"
                value={draft.goalWeightKg}
                onChangeText={(v) => update('goalWeightKg', v)}
                placeholder="Ex: 70"
              />
              {currentWeightKg > 0 && goalWeightKg > 0 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>{currentWeightKg > goalWeightKg ? 'Para perder' : 'Para ganhar'}</Text>
                  <Text style={styles.infoValue}>{Math.abs(currentWeightKg - goalWeightKg).toFixed(1)} kg</Text>
                </View>
              )}
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title="Qual seu nível de atividade física?" subtitle="">
              {ACTIVITY_OPTIONS.map((a) => (
                <OptionRow
                  key={a}
                  title={ACTIVITY_LEVEL_LABELS[a].title}
                  subtitle={ACTIVITY_LEVEL_LABELS[a].subtitle}
                  selected={draft.activityLevel === a}
                  onPress={() => update('activityLevel', a)}
                />
              ))}
            </StepShell>
          )}

          {step === 7 && (
            <StepShell title="Quão rápido você quer atingir sua meta?" subtitle="Ritmos mais lentos costumam ser mais sustentáveis.">
              <View style={styles.chipRow}>
                {PACE_OPTIONS.map((p) => (
                  <Chip key={p} label={`${p} kg/semana`} selected={draft.weeklyPaceGoalKg === p} onPress={() => update('weeklyPaceGoalKg', p)} />
                ))}
              </View>
            </StepShell>
          )}

          {step === 8 && (
            <StepShell title="O que está te motivando a alcançar essa meta?" subtitle="Pode escolher mais de uma (opcional).">
              <View style={styles.chipRow}>
                {MOTIVATION_OPTIONS.map((m) => (
                  <Chip key={m} label={m} selected={draft.motivations.includes(m)} onPress={() => toggleMotivation(m)} />
                ))}
              </View>
            </StepShell>
          )}

          {step === 9 && (
            <StepShell title="Qual medicamento você quer usar?" subtitle="Vamos usar isso para os lembretes de dose.">
              <Text style={[typography.label, { marginBottom: spacing.xs }]}>Nome do medicamento</Text>
              <View style={styles.chipRow}>
                {MEDICATION_OPTIONS.map((med) => (
                  <Chip
                    key={med}
                    label={med}
                    selected={draft.medNameOption === med}
                    onPress={() => setDraft((prev) => ({ ...prev, medNameOption: med, medName: med }))}
                  />
                ))}
                <Chip
                  label={OTHER_OPTION_LABEL}
                  selected={draft.medNameOption === OTHER_OPTION_LABEL}
                  onPress={() => setDraft((prev) => ({ ...prev, medNameOption: OTHER_OPTION_LABEL, medName: '' }))}
                />
              </View>

              {draft.medNameOption === OTHER_OPTION_LABEL && (
                <TextField
                  label="Nome do medicamento"
                  value={draft.medName}
                  onChangeText={(v) => update('medName', v)}
                  placeholder="Ex: Tirzepatida manipulada"
                />
              )}

              <TextField label="Dose inicial (mg)" keyboardType="decimal-pad" value={draft.medDoseMg} onChangeText={(v) => update('medDoseMg', v)} placeholder="Ex: 5" />
              <DateTimeField
                label={draft.treatmentStage === 'aplicando' ? 'Próxima dose' : 'Data da primeira dose'}
                value={draft.nextDoseAt}
                onChange={(d) => update('nextDoseAt', d)}
              />
            </StepShell>
          )}

          {step === 10 && (
            <StepShell title="Com qual frequência você vai aplicar?" subtitle="Para enviarmos lembretes no dia certo.">
              {FREQUENCY_OPTIONS.map((freq) => (
                <OptionRow
                  key={freq.label}
                  title={freq.label}
                  selected={draft.medFrequencyLabel === freq.label}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      medFrequencyLabel: freq.label,
                      medFrequencyDays: freq.days !== null ? String(freq.days) : prev.medFrequencyDays,
                    }))
                  }
                />
              ))}

              {draft.medFrequencyLabel === OTHER_OPTION_LABEL && (
                <TextField
                  label="A cada quantos dias?"
                  keyboardType="number-pad"
                  value={draft.medFrequencyDays}
                  onChangeText={(v) => update('medFrequencyDays', v)}
                  placeholder="Ex: 10"
                />
              )}
            </StepShell>
          )}

          {step === TOTAL_STEPS - 1 && preview && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.summaryTitle}>Seu plano está pronto! 🎉</Text>
              <View style={styles.summaryCard}>
                <Text style={typography.subtitle}>Metas diárias</Text>
                <SummaryRow label="Calorias" value={`${preview.calories} kcal`} />
                <SummaryRow label="Proteína" value={`${preview.protein} g`} />
                <SummaryRow label="Carboidrato" value={`${preview.carb} g`} />
                <SummaryRow label="Gordura" value={`${preview.fat} g`} />
                <SummaryRow label="Fibra" value={`${preview.fiber} g`} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < TOTAL_STEPS - 1 ? (
            <Button label="Continuar" onPress={goNext} />
          ) : (
            <Button label="Começar minha jornada" onPress={finish} loading={saving} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={typography.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={{ marginTop: spacing.lg }}>{children}</View>
    </View>
  );
}

function OptionRow({ title, subtitle, selected, onPress }: { title: string; subtitle?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backArrow: { fontSize: 28, lineHeight: 32, color: colors.textPrimary },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  footer: { padding: spacing.lg },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  optionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  infoBox: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  bmiBox: { flexDirection: 'column', alignItems: 'stretch' },
  infoBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bmiCategory: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  summaryTitle: { ...typography.title, textAlign: 'center', marginBottom: spacing.md },
  summaryCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2, borderTopWidth: 1, borderTopColor: colors.border },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
});
