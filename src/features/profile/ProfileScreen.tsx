/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { showToast } from '../../shared/toast';
import { Linking, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { TextField } from '../../shared/components/TextField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { IconButton } from '../../shared/components/IconButton';
import { ToggleRow } from '../../shared/components/ToggleRow';
import { CollapsibleSection } from '../../shared/components/CollapsibleSection';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { symptomRepository } from '../../db/repositories';
import { SymptomLog, SymptomTag } from '../../types';
import { SYMPTOM_TAG_LABELS } from '../../shared/labels';
import { formatDateTimePt } from '../../shared/date';
import {
  NotificationPermissionState,
  ensureNotificationPermission,
  getNotificationPermissionState,
  sendTestNotification,
} from '../../notifications/notifications';
import { resyncNotifications } from '../../notifications/sync';
import { exportCsv, exportPdf } from './export';
import { resetAllData } from '../../db/reset';
import { useAuthStore } from '../../store/useAuthStore';
import { signOutUser } from '../../firebase/auth';
import { ActivityLevel, Sex } from '../../types';
import { ACTIVITY_LEVEL_LABELS, ACTIVITY_OPTIONS, PACE_OPTIONS, SEX_LABELS, SEX_OPTIONS } from '../../shared/nutritionCalc';
import { getBiometricLockEnabled, isBiometricHardwareAvailable, setBiometricLockEnabled } from '../../shared/appLock';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { daysLeft } from '../../firebase/subscription';
import { DeleteAccountModal } from './DeleteAccountModal';

const SYMPTOM_TAGS: SymptomTag[] = ['nausea', 'fadiga', 'dor_de_cabeca', 'constipacao', 'outro'];

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const user = useAppStore((s) => s.user);
  const patchUser = useAppStore((s) => s.patchUser);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const refreshMedication = useAppStore((s) => s.refreshMedication);
  const bump = useAppStore((s) => s.bump);

  const subscription = useSubscriptionStore((s) => s.subscription);
  const subscriptionStatus = useSubscriptionStore((s) => s.status);

  const [editing, setEditing] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [startWeightKg, setStartWeightKg] = useState('');
  const [goalWeightKg, setGoalWeightKg] = useState('');
  const [dailyWaterGoalMl, setDailyWaterGoalMl] = useState('');
  const [cupSizeMl, setCupSizeMl] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [weeklyPaceGoalKg, setWeeklyPaceGoalKg] = useState(0.5);

  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [selectedTags, setSelectedTags] = useState<SymptomTag[]>([]);
  const [symptomNotes, setSymptomNotes] = useState('');

  const [permission, setPermission] = useState<NotificationPermissionState>('granted');
  const refreshPermission = useCallback(() => {
    getNotificationPermissionState().then(setPermission);
  }, []);
  // Ao voltar para a tela (inclusive dos ajustes do aparelho) confere de novo se as notificacoes estao liberadas.
  useFocusEffect(refreshPermission);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  useEffect(() => {
    isBiometricHardwareAvailable().then(setBiometricAvailable);
    getBiometricLockEnabled().then(setBiometricEnabledState);
  }, []);

  async function handleToggleBiometric() {
    const next = !biometricEnabled;
    await setBiometricLockEnabled(next);
    setBiometricEnabledState(next);
  }

  function loadFormFromUser() {
    if (!user) return;
    setName(user.name);
    setAge(user.age ? String(user.age) : '');
    setHeightCm(user.heightCm ? String(user.heightCm) : '');
    setStartWeightKg(user.startWeightKg ? String(user.startWeightKg) : '');
    setGoalWeightKg(user.goalWeightKg ? String(user.goalWeightKg) : '');
    setDailyWaterGoalMl(String(user.dailyWaterGoalMl));
    setCupSizeMl(String(user.cupSizeMl));
    setSex(user.sex);
    setActivityLevel(user.activityLevel);
    setWeeklyPaceGoalKg(user.weeklyPaceGoalKg ?? 0.5);
  }

  useEffect(() => {
    loadFormFromUser();
  }, [user]);

  const loadSymptoms = useCallback(async () => {
    setSymptoms(await symptomRepository.listAll());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSymptoms();
    }, [loadSymptoms])
  );

  async function handleSaveProfile() {
    await patchUser({
      name,
      age: parseInt(age, 10) || null,
      heightCm: parseFloat(heightCm.replace(',', '.')) || null,
      startWeightKg: parseFloat(startWeightKg.replace(',', '.')) || null,
      goalWeightKg: parseFloat(goalWeightKg.replace(',', '.')) || null,
      dailyWaterGoalMl: parseInt(dailyWaterGoalMl, 10) || 2000,
      cupSizeMl: parseInt(cupSizeMl, 10) || 250,
      sex,
      activityLevel,
      weeklyPaceGoalKg,
    });
    setEditing(false);
    showToast('Perfil atualizado ✓');
  }

  function handleCancelEdit() {
    loadFormFromUser();
    setEditing(false);
  }

  async function handleToggleNotification(field: 'notifyDose' | 'notifyMeal' | 'notifyActivity') {
    if (!user) return;
    const next = !user[field];
    if (next) {
      await ensureNotificationPermission();
      refreshPermission();
    }
    // O reagendamento acontece no App, que reage a mudanca destes campos.
    await patchUser({ [field]: next } as any);
  }

  async function handleAllowNotifications() {
    // Depois de uma recusa o sistema nao mostra mais o pedido: so da para liberar nos ajustes do aparelho.
    if (!(await ensureNotificationPermission())) await Linking.openSettings();
    refreshPermission();
  }

  async function handleTestNotification() {
    if (!(await ensureNotificationPermission())) {
      refreshPermission();
      Alert.alert('Notificações bloqueadas', 'Libere as notificações do apliKI nos ajustes do aparelho para receber os lembretes.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    refreshPermission();
    const sent = await sendTestNotification();
    showToast(sent ? 'Notificação de teste chega em 5 segundos' : 'Notificações não são suportadas neste aparelho');
  }

  function handleResetData() {
    if (!user) return;
    Alert.alert(
      'Apagar todos os dados',
      'Isso remove permanentemente todos os seus registros (doses, pesos, água, refeições, atividades, lembretes e sintomas) e limpa o perfil. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            await resetAllData(user.id);
            await Promise.all([refreshUser(), refreshMedication()]);
            // Os lembretes foram apagados junto: tira do aparelho o que estava agendado para eles.
            await resyncNotifications();
            bump();
            Alert.alert('Pronto', 'Todos os dados foram apagados. Toque na engrenagem no topo do Perfil para editar seus dados e cadastre seu medicamento na aba Doses.');
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Você pode entrar novamente a qualquer momento com o mesmo e-mail e senha.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOutUser() },
    ]);
  }

  function toggleTag(tag: SymptomTag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSaveSymptom() {
    if (selectedTags.length === 0 && !symptomNotes.trim()) return;
    await symptomRepository.insert({ tags: selectedTags, notes: symptomNotes.trim() || null, dateTime: new Date().toISOString() });
    setSelectedTags([]);
    setSymptomNotes('');
    loadSymptoms();
  }

  if (!user) return null;

  const displayName = user.name?.trim() || 'Seu perfil';
  const initial = displayName.charAt(0).toUpperCase();
  const notificationsActive = [user.notifyDose, user.notifyWater, user.notifyMeal, user.notifyActivity].filter(Boolean).length;

  const remaining = daysLeft(subscription);
  const expiresLabel = subscription?.expiresAt ? subscription.expiresAt.toDate().toLocaleDateString('pt-BR') : null;
  const subscriptionHint =
    subscriptionStatus === 'trial'
      ? `Teste grátis · ${remaining === 0 ? 'vence hoje' : `${remaining} ${remaining === 1 ? 'dia' : 'dias'}`}`
      : subscriptionStatus === 'active'
        ? expiresLabel
          ? `Ativa até ${expiresLabel}`
          : 'Ativa'
        : 'Inativa';
  const subscriptionDetail =
    subscriptionStatus === 'trial'
      ? `Você está no teste grátis${expiresLabel ? ` até ${expiresLabel}` : ''}. Para continuar registrando e usando a IA depois disso, assine o apliKI.`
      : subscriptionStatus === 'active'
        ? expiresLabel
          ? `Sua assinatura está ativa até ${expiresLabel}. Obrigado por apoiar o apliKI!`
          : 'Sua assinatura está ativa e não tem data de vencimento. Obrigado por apoiar o apliKI!'
        : 'Sua assinatura não está ativa.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={typography.title}>Perfil</Text>
          <IconButton
            icon={<Text style={styles.gearIcon}>{editing ? '✕' : '⚙️'}</Text>}
            onPress={() => (editing ? handleCancelEdit() : setEditing(true))}
            accessibilityLabel={editing ? 'Cancelar edição' : 'Editar perfil'}
            size={40}
            style={editing ? { ...styles.gearButton, ...styles.gearButtonActive } : styles.gearButton}
          />
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryName}>{displayName}</Text>
              <Text style={styles.detail} numberOfLines={1}>
                {firebaseUser?.email}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <Stat label="Peso atual" value={user.currentWeightKg ? `${user.currentWeightKg} kg` : '—'} />
            <Stat label="Meta" value={user.goalWeightKg ? `${user.goalWeightKg} kg` : '—'} />
            <Stat label="Altura" value={user.heightCm ? `${user.heightCm} cm` : '—'} />
          </View>
        </Card>

        {editing && (
          <Card style={styles.editCard}>
            <Text style={typography.subtitle}>Editar perfil</Text>
            <TextField label="Nome" value={name} onChangeText={setName} maxLength={80} />
            <TextField label="Idade" keyboardType="number-pad" value={age} onChangeText={setAge} />
            <TextField label="Altura (cm)" keyboardType="decimal-pad" value={heightCm} onChangeText={setHeightCm} />
            <TextField label="Peso inicial (kg)" keyboardType="decimal-pad" value={startWeightKg} onChangeText={setStartWeightKg} />
            <Text style={styles.readonlyLabel}>Peso atual: {user.currentWeightKg ?? '—'} kg (atualizado ao registrar peso)</Text>
            <TextField label="Peso meta (kg)" keyboardType="decimal-pad" value={goalWeightKg} onChangeText={setGoalWeightKg} />

            <Text style={[typography.label, { marginBottom: spacing.xs }]}>Como você se identifica</Text>
            <View style={styles.chipRow}>
              {SEX_OPTIONS.map((s) => (
                <Chip key={s} label={SEX_LABELS[s]} selected={sex === s} onPress={() => setSex(s)} />
              ))}
            </View>

            <Text style={[typography.label, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Nível de atividade física</Text>
            <View style={styles.chipRow}>
              {ACTIVITY_OPTIONS.map((a) => (
                <Chip key={a} label={ACTIVITY_LEVEL_LABELS[a].title} selected={activityLevel === a} onPress={() => setActivityLevel(a)} />
              ))}
            </View>

            <Text style={[typography.label, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>Ritmo desejado de perda de peso</Text>
            <View style={styles.chipRow}>
              {PACE_OPTIONS.map((p) => (
                <Chip key={p} label={`${p} kg/semana`} selected={weeklyPaceGoalKg === p} onPress={() => setWeeklyPaceGoalKg(p)} />
              ))}
            </View>

            <Text style={[typography.subtitle, { marginTop: spacing.md }]}>Metas de água</Text>
            <TextField label="Meta diária de água (ml)" keyboardType="number-pad" value={dailyWaterGoalMl} onChangeText={setDailyWaterGoalMl} />
            <TextField label="Tamanho do copo (ml)" keyboardType="number-pad" value={cupSizeMl} onChangeText={setCupSizeMl} />

            <View style={styles.editButtons}>
              <Button label="Cancelar" variant="secondary" onPress={handleCancelEdit} style={{ flex: 1 }} />
              <Button label="Salvar" onPress={handleSaveProfile} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        <CollapsibleSection icon="⭐" title="Assinatura" hint={subscriptionHint}>
          <Text style={styles.detail}>{subscriptionDetail}</Text>
        </CollapsibleSection>

        <CollapsibleSection icon="🔔" title="Notificações" hint={permission === 'denied' ? 'Bloqueadas no aparelho' : `${notificationsActive} de 4 ativas`}>
          {permission === 'denied' && (
            <View style={styles.permissionWarning}>
              <Text style={styles.permissionWarningText}>
                As notificações do apliKI estão bloqueadas neste aparelho, então nenhum lembrete vai aparecer.
              </Text>
              <Button label="Permitir notificações" onPress={handleAllowNotifications} style={{ marginTop: spacing.sm }} />
            </View>
          )}
          <NotificationRow label="Lembrete de dose" value={user.notifyDose} onToggle={() => handleToggleNotification('notifyDose')} />
          <Pressable
            style={styles.notificationRow}
            onPress={() => navigation.navigate('WaterReminders')}
            accessibilityRole="button"
            accessibilityLabel={`Lembretes de água, ${user.notifyWater ? 'ativado' : 'desativado'}`}
          >
            <Text style={styles.rowLabel}>Lembretes de água</Text>
            <View style={styles.notificationLinkValue}>
              <Text style={styles.notificationStatus}>{user.notifyWater ? 'Ativado' : 'Desativado'}</Text>
              <Text style={styles.notificationArrow}>›</Text>
            </View>
          </Pressable>
          <NotificationRow
            label="Lembrete de refeição"
            description="Às 08:00, 12:30 e 19:30, todos os dias."
            value={user.notifyMeal}
            onToggle={() => handleToggleNotification('notifyMeal')}
          />
          <NotificationRow
            label="Lembrete de atividade"
            description="Às 18:00, todos os dias."
            value={user.notifyActivity}
            onToggle={() => handleToggleNotification('notifyActivity')}
          />
          <Button label="Enviar notificação de teste" variant="secondary" onPress={handleTestNotification} style={{ marginTop: spacing.sm }} />
        </CollapsibleSection>

        <CollapsibleSection icon="🩺" title="Sintomas" hint={symptoms.length > 0 ? `${symptoms.length} ${symptoms.length === 1 ? 'registro' : 'registros'}` : 'Efeitos colaterais'}>
          <View style={styles.chipRow}>
            {SYMPTOM_TAGS.map((tag) => (
              <Chip key={tag} label={SYMPTOM_TAG_LABELS[tag]} selected={selectedTags.includes(tag)} onPress={() => toggleTag(tag)} />
            ))}
          </View>
          <TextField label="Observações (opcional)" value={symptomNotes} onChangeText={setSymptomNotes} multiline placeholder="Descreva como está se sentindo" />
          <Button label="Registrar sintoma" variant="secondary" onPress={handleSaveSymptom} />

          {symptoms.length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              {symptoms.slice(0, 8).map((s) => (
                <View key={s.id} style={styles.symptomRow}>
                  <Text style={styles.symptomTags}>{s.tags.map((t) => SYMPTOM_TAG_LABELS[t]).join(', ') || 'Observação'}</Text>
                  <Text style={styles.detail}>{formatDateTimePt(new Date(s.dateTime))}</Text>
                  {s.notes && <Text style={styles.detail}>{s.notes}</Text>}
                </View>
              ))}
            </View>
          )}
        </CollapsibleSection>

        <CollapsibleSection icon="🔒" title="Segurança" hint={biometricEnabled ? 'Biometria ativada' : 'Biometria desativada'}>
          {biometricAvailable ? (
            <ToggleRow label="Bloqueio por biometria" value={biometricEnabled} onValueChange={() => handleToggleBiometric()} />
          ) : (
            <Text style={styles.detail}>
              Configure a biometria (digital ou Face ID) nas configurações do seu aparelho para poder proteger o app.
            </Text>
          )}
        </CollapsibleSection>

        <CollapsibleSection icon="📄" title="Exportar dados" hint="PDF ou CSV para o médico">
          <Text style={[styles.detail, { marginBottom: spacing.sm }]}>Gere um relatório com histórico de peso, doses e sintomas para levar ao médico.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Exportar PDF" onPress={() => exportPdf(user)} style={{ flex: 1 }} />
            <Button label="Exportar CSV" variant="secondary" onPress={exportCsv} style={{ flex: 1 }} />
          </View>
        </CollapsibleSection>

        <CollapsibleSection icon="🛡️" title="Privacidade e dados" hint="Política e apagar dados">
          <Pressable style={styles.notificationRow} onPress={() => navigation.navigate('PrivacyPolicy')} accessibilityRole="button">
            <Text style={styles.rowLabel}>Política de privacidade</Text>
            <Text style={styles.notificationArrow}>›</Text>
          </Pressable>
          <Text style={[styles.detail, { marginTop: spacing.sm, marginBottom: spacing.sm }]}>
            Remove permanentemente todos os seus registros na nuvem (doses, pesos, água, refeições, atividades, lembretes e
            sintomas) e zera o perfil, mantendo a mesma conta.
          </Text>
          <Button label="Apagar tudo e recomeçar" variant="danger" onPress={handleResetData} />
          <Text style={[styles.detail, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
            Exclui a conta de vez, junto com todos os dados. Você não conseguirá mais entrar com este e-mail e senha.
          </Text>
          <Button label="Excluir minha conta" variant="ghost" onPress={() => setDeleteAccountVisible(true)} />
        </CollapsibleSection>
        <DeleteAccountModal visible={deleteAccountVisible} onClose={() => setDeleteAccountVisible(false)} />

        <Button label="Sair da conta" variant="secondary" onPress={handleLogout} style={{ marginTop: spacing.lg }} />

        <Text style={styles.disclaimerText}>
          O apliKI é uma ferramenta de acompanhamento pessoal e não substitui orientação médica. Consulte sempre um profissional de saúde.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NotificationRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return <ToggleRow label={label} description={description} value={value} onValueChange={() => onToggle()} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gearButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  gearButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  gearIcon: { fontSize: 18, color: colors.textPrimary },
  summaryCard: { marginTop: spacing.md },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontSize: 22, fontWeight: '700' },
  summaryName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  editCard: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md },
  editButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  readonlyLabel: { ...typography.caption, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  rowLabel: { ...typography.body, fontSize: 15 },
  permissionWarning: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  permissionWarningText: { color: colors.danger, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  // Mesma altura minima da ToggleRow, para as linhas da lista ficarem alinhadas.
  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingVertical: spacing.sm },
  notificationLinkValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notificationStatus: { ...typography.small },
  notificationArrow: { color: colors.textSecondary, fontSize: 18 },
  symptomRow: { paddingVertical: spacing.xs + 2, borderTopWidth: 1, borderTopColor: colors.border },
  symptomTags: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  detail: { ...typography.caption },
  disclaimerText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16, textAlign: 'center', marginTop: spacing.lg },
});
