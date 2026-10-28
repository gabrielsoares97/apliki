/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useRef, useState } from 'react';
import { showToast } from '../../shared/toast';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { TextField } from '../../shared/components/TextField';
import { DateTimeField } from '../../shared/components/DateTimeField';
import { Chip } from '../../shared/components/Chip';
import { Button } from '../../shared/components/Button';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { MealCategory, MealLog } from '../../types';
import { MEAL_CATEGORY_LABELS } from '../../shared/labels';
import { mealRepository } from '../../db/repositories';
import { newId } from '../../db/database';
import { useAppStore } from '../../store/useAppStore';
import { analyzeMeal, AnalyzeMealItemOutput } from '../../firebase/analyzeMeal';
import { FoodItem, searchFoods } from '../../shared/foodDatabase';

interface MealFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingMeal?: MealLog | null;
  prefill?: Partial<MealLog> | null;
}

interface MealItem {
  name: string;
  quantity: string;
}

const CATEGORIES: MealCategory[] = ['cafe', 'almoco', 'jantar', 'lanche'];

/** Limite do Worker de IA. */
const AI_MAX_ITEMS = 20;

function formatItem(item: MealItem): string {
  return item.quantity ? `${item.name} (${item.quantity})` : item.name;
}

/** Reconstroi a lista de alimentos a partir do nome salvo, ex.: "Arroz (150g), Frango (100g)". */
function parseItems(mealName: string | undefined): MealItem[] {
  if (!mealName) return [];
  return mealName
    .split(/,\s*(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s*\((.*)\)$/);
      return match ? { name: match[1].trim(), quantity: match[2].trim() } : { name: part, quantity: '' };
    });
}

function itemsSignature(items: MealItem[]): string {
  return items.map(formatItem).join('|');
}

export function MealFormModal({ visible, onClose, onSaved, editingMeal, prefill }: MealFormModalProps) {
  const bump = useAppStore((s) => s.bump);

  const [category, setCategory] = useState<MealCategory>('cafe');
  const [items, setItems] = useState<MealItem[]>([]);
  const [foodName, setFoodName] = useState('');
  const [foodQuantity, setFoodQuantity] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  /** Assinatura da lista no momento do ultimo calculo (ou do carregamento), para avisar quando ficou desatualizado. */
  const [calculatedSignature, setCalculatedSignature] = useState('');
  /** Valores por alimento devolvidos pela IA no ultimo calculo (mesma ordem da lista). */
  const [itemNutrition, setItemNutrition] = useState<AnalyzeMealItemOutput[] | null>(null);
  const [saving, setSaving] = useState(false);
  // Id da nova refeicao, fixo enquanto o formulario esta aberto: tentar salvar de novo nao duplica o registro.
  const recordIdRef = useRef(newId());

  useEffect(() => {
    if (!visible) return;
    const source = editingMeal ?? prefill;
    const initialItems = parseItems(source?.name);
    setCategory(source?.category ?? 'cafe');
    setItems(initialItems);
    setCalculatedSignature(source?.calories !== undefined ? itemsSignature(initialItems) : '');
    setItemNutrition(null);
    setFoodName('');
    setFoodQuantity('');
    setSuggestions([]);
    setCalories(source?.calories !== undefined ? String(source.calories) : '');
    setProtein(source?.protein !== undefined ? String(source.protein) : '');
    setCarb(source?.carb !== undefined ? String(source.carb) : '');
    setFat(source?.fat !== undefined ? String(source.fat) : '');
    setFiber(source?.fiber !== undefined ? String(source.fiber) : '');
    setDateTime(editingMeal ? new Date(editingMeal.dateTime) : new Date());
    // Editar uma favorita nao pode tira-la dos favoritos; refeicao nova (mesmo vinda de favorita) comeca desmarcada.
    setSaveFavorite(editingMeal?.isFavorite ?? false);
    recordIdRef.current = newId();
  }, [visible, editingMeal, prefill]);

  function num(v: string): number {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
  }

  function handleFoodNameChange(value: string) {
    setFoodName(value);
    setSuggestions(searchFoods(value));
  }

  function pickSuggestion(food: FoodItem) {
    setFoodName(food.name);
    if (!foodQuantity.trim()) setFoodQuantity('100g');
    setSuggestions([]);
  }

  function handleAddFood() {
    const trimmed = foodName.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { name: trimmed, quantity: foodQuantity.trim() }]);
    setFoodName('');
    setFoodQuantity('');
    setSuggestions([]);
  }

  function handleRemoveFood(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const currentSignature = itemsSignature(items);
  const needsRecalculation = items.length > 0 && calculatedSignature !== currentSignature;

  async function handleAnalyzeWithAi() {
    // Inclui o alimento que ainda esta no campo, se o usuario nao tocou em "Adicionar".
    let list = items;
    if (foodName.trim()) {
      list = [...items, { name: foodName.trim(), quantity: foodQuantity.trim() }];
      setItems(list);
      setFoodName('');
      setFoodQuantity('');
      setSuggestions([]);
    }
    if (list.length === 0) {
      Alert.alert('Adicione os alimentos', 'Inclua ao menos um alimento da refeição antes de calcular com a IA.');
      return;
    }
    if (list.length > AI_MAX_ITEMS || list.some((i) => i.name.length > 120 || i.quantity.length > 120)) {
      Alert.alert('Lista muito longa', 'Use no máximo 20 alimentos e descrições curtas para calcular com a IA.');
      return;
    }

    setAiLoading(true);
    try {
      const result = await analyzeMeal({ items: list });
      setItemNutrition(result.items && result.items.length === list.length ? result.items : null);
      setCalories(String(Math.round(result.calories)));
      setProtein(String(Math.round(result.protein)));
      setCarb(String(Math.round(result.carb)));
      setFat(String(Math.round(result.fat)));
      setFiber(String(Math.round(result.fiber)));
      setCalculatedSignature(itemsSignature(list));
    } catch (error) {
      Alert.alert('Não foi possível calcular', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    let list = items;
    if (foodName.trim()) list = [...items, { name: foodName.trim(), quantity: foodQuantity.trim() }];
    if (list.length === 0) {
      Alert.alert('Adicione os alimentos', 'Inclua ao menos um alimento para salvar a refeição.');
      return;
    }
    const payload = {
      category,
      name: list.map(formatItem).join(', '),
      calories: num(calories),
      protein: num(protein),
      carb: num(carb),
      fat: num(fat),
      fiber: num(fiber),
      dateTime: dateTime.toISOString(),
      isFavorite: saveFavorite,
    };

    setSaving(true);
    try {
      if (editingMeal) {
        await mealRepository.update(editingMeal.id, payload);
      } else {
        await mealRepository.insert(payload, recordIdRef.current);
      }

      bump();
      onSaved?.();
      showToast('Refeição salva ✓');
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar a refeição', 'Verifique sua conexão com a internet e tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalSheet visible={visible} title={editingMeal ? 'Editar refeição' : 'Registrar refeição'} onClose={onClose}>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={[typography.label, { marginBottom: spacing.xs }]}>Categoria</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={MEAL_CATEGORY_LABELS[c]} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Alimentos da refeição</Text>

      {items.length > 0 && (
        <View style={styles.itemList}>
          {items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.itemRow}>
              <View style={styles.itemBullet}>
                <Text style={styles.itemBulletText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>{item.quantity || 'Quantidade não informada'}</Text>
                {!needsRecalculation && itemNutrition?.[index] && (
                  <Text style={styles.itemNutrition}>
                    {Math.round(itemNutrition[index].calories)} kcal · {Math.round(itemNutrition[index].protein)}g prot
                  </Text>
                )}
              </View>
              <Pressable onPress={() => handleRemoveFood(index)} hitSlop={10} style={styles.removeButton} accessibilityLabel="Remover alimento">
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.addBox}>
        <TextField label="Alimento" value={foodName} onChangeText={handleFoodNameChange} placeholder="Ex: Arroz branco" />

        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((food) => (
              <Pressable key={food.name} style={styles.suggestionRow} onPress={() => pickSuggestion(food)}>
                <Text style={styles.suggestionName}>{food.name}</Text>
                <Text style={styles.suggestionDetail}>{food.calories} kcal/100g</Text>
              </Pressable>
            ))}
          </View>
        )}

        <TextField label="Quantidade" value={foodQuantity} onChangeText={setFoodQuantity} placeholder="Ex: 150g, 2 unidades, 1 concha" />
        <Button label="+ Adicionar alimento" variant="secondary" onPress={handleAddFood} disabled={!foodName.trim()} />
      </View>

      <Button
        label="✨ Calcular total com IA"
        accessibilityLabel={aiLoading ? 'Calculando total com IA' : 'Calcular total com IA'}
        onPress={handleAnalyzeWithAi}
        loading={aiLoading}
        style={{ marginTop: spacing.md }}
      />
      <Text style={[styles.hint, needsRecalculation && styles.hintWarning]}>
        {needsRecalculation
          ? 'A lista mudou desde o último cálculo. Toque em calcular para atualizar os valores.'
          : 'A IA soma todos os alimentos da lista e preenche o total da refeição.'}
      </Text>

      <Text style={styles.sectionTitle}>Total da refeição</Text>
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <TextField label="Calorias" keyboardType="decimal-pad" value={calories} onChangeText={setCalories} />
        </View>
        <View style={styles.gridItem}>
          <TextField label="Proteína (g)" keyboardType="decimal-pad" value={protein} onChangeText={setProtein} />
        </View>
        <View style={styles.gridItem}>
          <TextField label="Carboidrato (g)" keyboardType="decimal-pad" value={carb} onChangeText={setCarb} />
        </View>
        <View style={styles.gridItem}>
          <TextField label="Gordura (g)" keyboardType="decimal-pad" value={fat} onChangeText={setFat} />
        </View>
        <View style={styles.gridItem}>
          <TextField label="Fibra (g)" keyboardType="decimal-pad" value={fiber} onChangeText={setFiber} />
        </View>
      </View>

      <DateTimeField label="Data e hora" value={dateTime} onChange={setDateTime} />

      <Pressable
        style={styles.favoriteRow}
        onPress={() => setSaveFavorite((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: saveFavorite }}
      >
        <View style={[styles.checkbox, saveFavorite && styles.checkboxChecked]}>
          {saveFavorite && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={{ color: colors.textPrimary }}>Salvar como favorita</Text>
      </Pressable>

      <Button label={editingMeal ? 'Salvar alterações' : 'Salvar refeição'} onPress={handleSave} loading={saving} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  sectionTitle: { ...typography.sectionTitle, marginBottom: spacing.sm, marginTop: spacing.xs },
  itemList: { gap: spacing.sm, marginBottom: spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
  },
  itemBullet: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemBulletText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  itemQuantity: { ...typography.caption, marginTop: 1 },
  itemNutrition: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  removeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.textSecondary, fontWeight: '700' },
  addBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
  },
  suggestionsBox: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionName: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  suggestionDetail: { ...typography.caption },
  hint: { ...typography.caption, marginTop: spacing.xs, marginBottom: spacing.md, textAlign: 'center' },
  hintWarning: { color: colors.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%' },
  favoriteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44, marginBottom: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.onPrimary, fontWeight: '700', fontSize: 13 },
});
