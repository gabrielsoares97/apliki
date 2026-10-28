/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useRef, useState } from 'react';
import { showToast } from '../../shared/toast';
import { Alert } from '../../shared/dialog';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { ApplicationSite, DoseLog } from '../../types';
import { APPLICATION_SITE_LABELS } from '../../shared/labels';
import { doseRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { useAppStore } from '../../store/useAppStore';
import { suggestNextApplicationSite } from '../../shared/applicationSite';
import { syncMedicationWithDoses } from './doseSync';

interface DoseFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingDose?: DoseLog | null;
}

const SITES: ApplicationSite[] = ['abdomen', 'coxa', 'braco', 'outro'];

export function DoseFormModal({ visible, onClose, onSaved, editingDose }: DoseFormModalProps) {
  const navigation = useNavigation<any>();
  const medication = useAppStore((s) => s.medication);
  const bump = useAppStore((s) => s.bump);

  const [doseMg, setDoseMg] = useState('');
  const [site, setSite] = useState<ApplicationSite | null>(null);
  const [suggestedSite, setSuggestedSite] = useState<ApplicationSite | null>(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  // Id da nova dose, fixo enquanto o formulario esta aberto: tentar salvar de novo nao duplica o registro.
  const recordIdRef = useRef(newId());

  useEffect(() => {
    if (visible) recordIdRef.current = newId();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setDoseMg(editingDose ? String(editingDose.doseMg) : medication ? String(medication.defaultDoseMg) : '');
      setDateTime(editingDose ? new Date(editingDose.dateTime) : new Date());
      setNotes(editingDose?.notes ?? '');

      if (editingDose) {
        setSite(editingDose.applicationSite ?? null);
        setSuggestedSite(null);
      } else {
        doseRepository
          .listAll()
          .then((doses) => {
            const suggestion = suggestNextApplicationSite(doses[0] ?? null);
            setSuggestedSite(suggestion);
            setSite(suggestion);
          })
          .catch(() => setSuggestedSite(null));
      }
    }
  }, [visible, medication, editingDose]);

  async function handleSave() {
    if (!medication || saving) return;
    const dose = parseFloat(doseMg.replace(',', '.'));
    if (Number.isNaN(dose) || dose <= 0) return;

    setSaving(true);
    try {
      if (editingDose) {
        await doseRepository.update(editingDose.id, {
          doseMg: dose,
          applicationSite: site,
          dateTime: dateTime.toISOString(),
          notes: notes.trim() || null,
        });
        // A data pode ter mudado: a proxima dose e recalculada a partir da dose mais recente.
        await syncMedicationWithDoses(0);
      } else {
        await doseRepository.insert(
          {
            medicationId: medication.id,
            doseMg: dose,
            applicationSite: site,
            dateTime: dateTime.toISOString(),
            notes: notes.trim() || null,
          },
          recordIdRef.current
        );
        // Uma dose antiga registrada agora nao adianta a proxima: ela sai sempre da dose mais recente.
        await syncMedicationWithDoses(-1);
      }

      bump();
      onSaved?.();
      showToast('Dose salva ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar a dose', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  if (!medication && visible) {
    return (
      <ModalSheet visible={visible} title="Registrar dose" onClose={onClose}>
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
          Você ainda não cadastrou seu medicamento. Cadastre primeiro para poder registrar doses.
        </Text>
        <Button
          label="Cadastrar medicamento"
          onPress={() => {
            onClose();
            navigation.navigate('DosesTab', { screen: 'MedicationSettings' });
          }}
        />
      </ModalSheet>
    );
  }

  return (
    <ModalSheet visible={visible} title={editingDose ? 'Editar dose' : 'Registrar dose'} onClose={onClose}>
      <TextField label="Dosagem (mg)" keyboardType="decimal-pad" value={doseMg} onChangeText={setDoseMg} placeholder="Ex: 5" />

      <View style={{ marginBottom: spacing.md }}>
        <Text style={[typography.label, { marginBottom: spacing.xs }]}>Local de aplicação (opcional)</Text>
        <View style={styles.chipRow}>
          {SITES.map((s) => (
            <Chip key={s} label={APPLICATION_SITE_LABELS[s]} selected={site === s} onPress={() => setSite(site === s ? null : s)} />
          ))}
        </View>
        {suggestedSite && (
          <Text style={styles.rotationHint}>
            💡 Sugestão: revezar para {APPLICATION_SITE_LABELS[suggestedSite]} (local diferente da última aplicação, reduz o risco de lipodistrofia).
          </Text>
        )}
      </View>

      {medication?.penDosesRemaining !== null && medication?.penDosesRemaining !== undefined && medication.penDosesRemaining <= 1 && (
        <Text style={styles.penWarning}>⚠️ Última dose da caneta atual — hora de comprar a próxima.</Text>
      )}

      <DateTimeField label="Data e hora" value={dateTime} onChange={setDateTime} />
      <TextField label="Observações (opcional)" value={notes} onChangeText={setNotes} multiline placeholder="Ex: leve dor no local" />

      <Button
        label={editingDose ? 'Salvar alterações' : 'Salvar dose'}
        onPress={handleSave}
        disabled={!medication}
        loading={saving}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  rotationHint: { fontSize: 12, color: colors.primary, marginTop: spacing.xs },
  penWarning: { fontSize: 13, color: colors.warningText, fontWeight: '600', marginBottom: spacing.md },
});
