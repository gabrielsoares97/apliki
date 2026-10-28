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
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { spacing, typography } from '../../shared/theme';
import { ACTIVITY_TYPE_SUGGESTIONS } from '../../shared/labels';
import { activityRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { useAppStore } from '../../store/useAppStore';
import { ActivityLog } from '../../types';

interface ActivityFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingActivity?: ActivityLog | null;
}

export function ActivityFormModal({ visible, onClose, onSaved, editingActivity }: ActivityFormModalProps) {
  const bump = useAppStore((s) => s.bump);

  const [type, setType] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [calories, setCalories] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [saving, setSaving] = useState(false);
  // Id do novo registro, fixo enquanto o formulario esta aberto: tentar salvar de novo nao duplica a atividade.
  const recordIdRef = useRef(newId());

  useEffect(() => {
    if (visible) recordIdRef.current = newId();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setType(editingActivity?.type ?? '');
      setDurationMin(editingActivity ? String(editingActivity.durationMin) : '');
      setCalories(editingActivity ? String(editingActivity.calories) : '');
      setDateTime(editingActivity ? new Date(editingActivity.dateTime) : new Date());
    }
  }, [visible, editingActivity]);

  async function handleSave() {
    if (!type.trim() || saving) return;
    const duration = parseFloat(durationMin.replace(',', '.')) || 0;
    const cal = parseFloat(calories.replace(',', '.')) || 0;

    setSaving(true);
    try {
      const payload = { type: type.trim(), durationMin: duration, calories: cal, dateTime: dateTime.toISOString() };
      if (editingActivity) {
        await activityRepository.update(editingActivity.id, payload);
      } else {
        await activityRepository.insert(payload, recordIdRef.current);
      }
      bump();
      onSaved?.();
      showToast('Atividade salva ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalSheet visible={visible} title={editingActivity ? 'Editar atividade' : 'Registrar atividade'} onClose={onClose}>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={[typography.label, { marginBottom: spacing.xs }]}>Tipo</Text>
        <View style={styles.chipRow}>
          {ACTIVITY_TYPE_SUGGESTIONS.map((t) => (
            <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
      </View>
      <TextField label="Tipo (texto livre)" value={type} onChangeText={setType} placeholder="Ex: Pilates" />
      <TextField label="Duração (min)" keyboardType="decimal-pad" value={durationMin} onChangeText={setDurationMin} />
      <TextField label="Calorias estimadas" keyboardType="decimal-pad" value={calories} onChangeText={setCalories} />
      <DateTimeField label="Data e hora" value={dateTime} onChange={setDateTime} />
      <Button label={editingActivity ? 'Salvar alterações' : 'Salvar atividade'} onPress={handleSave} loading={saving} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
