/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useRef, useState } from 'react';
import { showToast } from '../../shared/toast';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Button } from '../../shared/components/Button';
import { IconButton } from '../../shared/components/IconButton';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { weightRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { syncCurrentWeightWithLogs } from './weightSync';
import { useAppStore } from '../../store/useAppStore';
import { PhotoAngle, WeightLog } from '../../types';
import { Alert } from '../../shared/dialog';
import { ProgressPhoto } from './ProgressPhoto';
import { deletePhoto, isCloudPhoto, uploadPhoto } from './photoStore';

interface WeightFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingWeight?: WeightLog | null;
}

const ANGLES: { key: PhotoAngle; label: string }[] = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

export function WeightFormModal({ visible, onClose, onSaved, editingWeight }: WeightFormModalProps) {
  const user = useAppStore((s) => s.user);
  const bump = useAppStore((s) => s.bump);
  // Id do novo registro, fixo enquanto o formulario esta aberto: tentar salvar de novo nao duplica o peso.
  const recordIdRef = useRef(newId());

  const [weightKg, setWeightKg] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [photoFrontUri, setPhotoFrontUri] = useState<string | null>(null);
  const [photoSideUri, setPhotoSideUri] = useState<string | null>(null);
  const [photoBackUri, setPhotoBackUri] = useState<string | null>(null);
  const [waistCm, setWaistCm] = useState('');
  const [hipCm, setHipCm] = useState('');
  const [armCm, setArmCm] = useState('');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) recordIdRef.current = newId();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setWeightKg(editingWeight ? String(editingWeight.weightKg) : user?.currentWeightKg ? String(user.currentWeightKg) : '');
      setDateTime(editingWeight ? new Date(editingWeight.dateTime) : new Date());
      setPhotoFrontUri(editingWeight?.photoFrontUri ?? null);
      setPhotoSideUri(editingWeight?.photoSideUri ?? null);
      setPhotoBackUri(editingWeight?.photoBackUri ?? null);
      setWaistCm(editingWeight?.waistCm ? String(editingWeight.waistCm) : '');
      setHipCm(editingWeight?.hipCm ? String(editingWeight.hipCm) : '');
      setArmCm(editingWeight?.armCm ? String(editingWeight.armCm) : '');
      setShowMeasurements(!!(editingWeight?.waistCm || editingWeight?.hipCm || editingWeight?.armCm));
    }
  }, [visible, user, editingWeight]);

  const photoSetters: Record<PhotoAngle, (uri: string | null) => void> = {
    front: setPhotoFrontUri,
    side: setPhotoSideUri,
    back: setPhotoBackUri,
  };
  const photoValues: Record<PhotoAngle, string | null> = {
    front: photoFrontUri,
    side: photoSideUri,
    back: photoBackUri,
  };

  async function pickPhoto(angle: PhotoAngle) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets[0]) photoSetters[angle](result.assets[0].uri);
  }

  async function handleSave() {
    const weight = parseFloat(weightKg.replace(',', '.'));
    if (Number.isNaN(weight) || weight <= 0 || saving) return;

    setSaving(true);
    try {
      // Fotos recem-escolhidas ainda sao arquivos do aparelho: envia para a nuvem antes de salvar o registro.
      const uploaded: Record<PhotoAngle, string | null> = { front: null, side: null, back: null };
      try {
        for (const { key } of ANGLES) {
          const value = photoValues[key];
          uploaded[key] = value && !isCloudPhoto(value) ? await uploadPhoto(value) : value;
        }
      } catch {
        Alert.alert('Não foi possível enviar a foto', 'Verifique sua conexão com a internet e tente salvar de novo.');
        return;
      }
      // As fotos ja enviadas ficam no formulario como referencia da nuvem: tentar de novo nao reenvia.
      setPhotoFrontUri(uploaded.front);
      setPhotoSideUri(uploaded.side);
      setPhotoBackUri(uploaded.back);

      const payload = {
        weightKg: weight,
        dateTime: dateTime.toISOString(),
        photoFrontUri: uploaded.front,
        photoSideUri: uploaded.side,
        photoBackUri: uploaded.back,
        waistCm: parseFloat(waistCm.replace(',', '.')) || null,
        hipCm: parseFloat(hipCm.replace(',', '.')) || null,
        armCm: parseFloat(armCm.replace(',', '.')) || null,
      };
      if (editingWeight) {
        await weightRepository.update(editingWeight.id, payload);
        // Fotos trocadas ou removidas nesta edicao nao sao mais usadas por nenhum registro.
        const previous = [editingWeight.photoFrontUri, editingWeight.photoSideUri, editingWeight.photoBackUri];
        const kept = [uploaded.front, uploaded.side, uploaded.back];
        await Promise.all(previous.filter((ref) => ref && !kept.includes(ref)).map((ref) => deletePhoto(ref)));
      } else {
        await weightRepository.insert(payload, recordIdRef.current);
      }
      // Peso atual = registro mais recente por data (um peso antigo registrado agora nao o sobrescreve).
      await syncCurrentWeightWithLogs();

      bump();
      onSaved?.();
      showToast('Peso salvo ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar o peso', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalSheet visible={visible} title={editingWeight ? 'Editar peso' : 'Registrar peso'} onClose={onClose}>
      <TextField label="Peso (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} placeholder="Ex: 84.6" />
      <DateTimeField label="Data e hora" value={dateTime} onChange={setDateTime} />

      <Text style={typography.label}>Fotos de progresso (opcional)</Text>
      <Text style={styles.photoHint}>Ficam salvas na sua conta: continuam aqui mesmo se você trocar de aparelho.</Text>
      <View style={styles.photoRow}>
        {ANGLES.map(({ key, label }) => {
          const uri = photoValues[key];
          return (
            <Pressable
              key={key}
              style={styles.photoBox}
              onPress={() => pickPhoto(key)}
              accessibilityRole="button"
              accessibilityLabel={uri ? `Trocar foto: ${label}` : `Adicionar foto: ${label}`}
            >
              {uri ? (
                <ProgressPhoto photoRef={uri} style={styles.photo} />
              ) : (
                <Text style={styles.photoPlaceholder}>+</Text>
              )}
              <Text style={styles.photoLabel}>{label}</Text>
              {uri && (
                <IconButton
                  icon={<Text style={styles.photoRemoveText}>✕</Text>}
                  onPress={() => photoSetters[key](null)}
                  accessibilityLabel={`Remover foto: ${label}`}
                  size={22}
                  style={styles.photoRemove}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setShowMeasurements((v) => !v)}
        style={{ marginBottom: spacing.sm }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityState={{ expanded: showMeasurements }}
      >
        <Text style={styles.measurementsToggle}>{showMeasurements ? '− Ocultar' : '+ Adicionar'} medidas corporais (opcional)</Text>
      </Pressable>

      {showMeasurements && (
        <View style={styles.measurementsRow}>
          <View style={styles.measurementItem}>
            <TextField label="Cintura (cm)" keyboardType="decimal-pad" value={waistCm} onChangeText={setWaistCm} />
          </View>
          <View style={styles.measurementItem}>
            <TextField label="Quadril (cm)" keyboardType="decimal-pad" value={hipCm} onChangeText={setHipCm} />
          </View>
          <View style={styles.measurementItem}>
            <TextField label="Braço (cm)" keyboardType="decimal-pad" value={armCm} onChangeText={setArmCm} />
          </View>
        </View>
      )}

      <Button label={editingWeight ? 'Salvar alterações' : 'Salvar peso'} onPress={handleSave} loading={saving} style={{ marginTop: spacing.md }} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  photoBox: {
    flex: 1,
    height: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  photo: { width: '100%', height: '100%', position: 'absolute' },
  photoPlaceholder: { fontSize: 24, color: colors.textSecondary },
  photoLabel: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
    position: 'absolute',
    bottom: 4,
  },
  // Botao sobre a foto: fundo escuro e "x" branco ficam legiveis em qualquer imagem.
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  photoRemoveText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  photoHint: { fontSize: 11, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  measurementsToggle: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  measurementsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  measurementItem: { flex: 1 },
});
