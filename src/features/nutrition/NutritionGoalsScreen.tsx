/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { showToast } from '../../shared/toast';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TextField } from '../../shared/components/TextField';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { useAppStore } from '../../store/useAppStore';
import { calculateNutritionGoals } from '../../shared/nutritionCalc';

export function NutritionGoalsScreen() {
  const navigation = useNavigation<any>();
  const user = useAppStore((s) => s.user);
  const patchUser = useAppStore((s) => s.patchUser);

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  useEffect(() => {
    if (user) {
      setCalories(String(user.dailyCalorieGoal));
      setProtein(String(user.dailyProteinGoal));
      setCarb(String(user.dailyCarbGoal));
      setFat(String(user.dailyFatGoal));
      setFiber(String(user.dailyFiberGoal));
    }
  }, [user]);

  function calculateFromProfile() {
    if (!user?.currentWeightKg || !user.heightCm || !user.age) {
      Alert.alert(
        'Faltam dados do seu perfil',
        'Preencha idade, altura e peso atual na aba Perfil para calcular automaticamente.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Ir para o Perfil', onPress: () => navigation.navigate('PerfilTab') },
        ]
      );
      return;
    }

    const goals = calculateNutritionGoals({
      sex: user.sex,
      age: user.age,
      heightCm: user.heightCm,
      currentWeightKg: user.currentWeightKg,
      activityLevel: user.activityLevel,
      weeklyPaceGoalKg: user.weeklyPaceGoalKg,
    });
    setCalories(String(goals.calories));
    setProtein(String(goals.protein));
    setCarb(String(goals.carb));
    setFat(String(goals.fat));
    setFiber(String(goals.fiber));
  }

  async function handleSave() {
    await patchUser({
      dailyCalorieGoal: parseInt(calories, 10) || 0,
      dailyProteinGoal: parseInt(protein, 10) || 0,
      dailyCarbGoal: parseInt(carb, 10) || 0,
      dailyFatGoal: parseInt(fat, 10) || 0,
      dailyFiberGoal: parseInt(fiber, 10) || 0,
      nutritionGoalsSet: true,
    });
    showToast('Metas atualizadas ✓');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Defina manualmente ou calcule automaticamente a partir do seu perfil.
        </Text>

        <View style={{ marginBottom: spacing.md }}>
          <Button label="Calcular automaticamente" variant="secondary" onPress={calculateFromProfile} />
        </View>

        <TextField label="Calorias diárias (kcal)" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
        <TextField label="Proteína diária (g)" keyboardType="number-pad" value={protein} onChangeText={setProtein} />
        <TextField label="Carboidrato diário (g)" keyboardType="number-pad" value={carb} onChangeText={setCarb} />
        <TextField label="Gordura diária (g)" keyboardType="number-pad" value={fat} onChangeText={setFat} />
        <TextField label="Fibra diária (g)" keyboardType="number-pad" value={fiber} onChangeText={setFiber} />

        <Button label="Salvar metas" onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
});
