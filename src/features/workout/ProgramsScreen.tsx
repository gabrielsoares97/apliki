/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Alert } from '../../shared/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../shared/components/Card';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { Button } from '../../shared/components/Button';
import { colors, spacing, typography } from '../../shared/theme';
import { WORKOUT_PROGRAMS } from '../../shared/workoutPrograms';
import { WorkoutProgram } from '../../types';
import { workoutTemplateRepository } from '../../db/repositories';

const GOAL_LABELS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  resistencia: 'Resistência',
};

const LEVEL_LABELS: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export function ProgramsScreen() {
  const navigation = useNavigation<any>();
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [applying, setApplying] = useState(false);

  async function handleUseProgram(program: WorkoutProgram) {
    if (applying) return;
    setApplying(true);
    try {
      for (const template of program.templates) {
        await workoutTemplateRepository.insert({ name: template.name, exercises: template.exercises, createdAt: new Date().toISOString() });
      }
    } catch {
      Alert.alert('Não foi possível adicionar o programa', 'Verifique sua conexão com a internet e tente de novo. Treinos já salvos aparecem em Meus treinos.');
      return;
    } finally {
      setApplying(false);
    }
    setSelectedProgram(null);
    Alert.alert('Programa adicionado', `Os treinos de "${program.name}" foram salvos em Meus treinos.`, [
      { text: 'OK', onPress: () => navigation.navigate('MyWorkouts') },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Rotinas prontas e estruturadas — use como estão ou como ponto de partida.</Text>

        {WORKOUT_PROGRAMS.map((program) => (
          <Card key={program.id} style={{ marginTop: spacing.md }} onPress={() => setSelectedProgram(program)}>
            <Text style={typography.subtitle}>{program.name}</Text>
            <Text style={styles.meta}>
              {GOAL_LABELS[program.goal]} · {LEVEL_LABELS[program.level]} · {program.daysPerWeek}x/semana
            </Text>
            <Text style={styles.description}>{program.description}</Text>
          </Card>
        ))}
      </ScrollView>

      <ModalSheet visible={selectedProgram !== null} title={selectedProgram?.name ?? ''} onClose={() => setSelectedProgram(null)}>
        {selectedProgram && (
          <>
            <Text style={styles.description}>{selectedProgram.description}</Text>
            {selectedProgram.templates.map((template) => (
              <View key={template.name} style={styles.templatePreview}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.meta}>{template.exercises.length} exercícios</Text>
              </View>
            ))}
            <Button label="Usar este programa" onPress={() => handleUseProgram(selectedProgram)} loading={applying} style={{ marginTop: spacing.md }} />
          </>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  intro: { ...typography.small, lineHeight: 19 },
  description: { ...typography.small, marginTop: 4 },
  meta: { ...typography.caption, marginTop: 2, marginBottom: 4 },
  templatePreview: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  templateName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
