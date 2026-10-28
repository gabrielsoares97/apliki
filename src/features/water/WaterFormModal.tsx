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
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Button } from '../../shared/components/Button';
import { spacing } from '../../shared/theme';
import { waterRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { useAppStore } from '../../store/useAppStore';
import { WaterLog } from '../../types';

interface WaterFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingWater?: WaterLog | null;
}

export function WaterFormModal({ visible, onClose, onSaved, editingWater }: WaterFormModalProps) {
  const cupSizeMl = useAppStore((s) => s.user?.cupSizeMl ?? 250);
  const bump = useAppStore((s) => s.bump);

  const [amountMl, setAmountMl] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [saving, setSaving] = useState(false);
  // Id do novo registro, fixo enquanto o formulario esta aberto: tentar salvar de novo nao duplica a agua.
  const recordIdRef = useRef(newId());

  useEffect(() => {
    if (visible) recordIdRef.current = newId();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setAmountMl(editingWater ? String(editingWater.amountMl) : String(cupSizeMl));
      setDateTime(editingWater ? new Date(editingWater.dateTime) : new Date());
    }
  }, [visible, cupSizeMl, editingWater]);

  async function handleSave() {
    const amount = parseInt(amountMl, 10);
    if (Number.isNaN(amount) || amount <= 0 || saving) return;

    setSaving(true);
    try {
      if (editingWater) {
        await waterRepository.update(editingWater.id, { amountMl: amount, dateTime: dateTime.toISOString() });
      } else {
        await waterRepository.insert({ amountMl: amount, dateTime: dateTime.toISOString() }, recordIdRef.current);
      }
      bump();
      onSaved?.();
      showToast('Água salva ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalSheet visible={visible} title={editingWater ? 'Editar água' : 'Registrar água'} onClose={onClose}>
      <TextField label="Quantidade (ml)" keyboardType="number-pad" value={amountMl} onChangeText={setAmountMl} />
      <DateTimeField label="Data e hora" value={dateTime} onChange={setDateTime} />
      <Button
        label={editingWater ? 'Salvar alterações' : 'Salvar'}
        onPress={handleSave}
        loading={saving}
        style={{ marginTop: spacing.md }}
      />
    </ModalSheet>
  );
}
