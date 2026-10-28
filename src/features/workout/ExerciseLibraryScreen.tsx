/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../shared/theme';
import { ExercisePickerModal } from './ExercisePickerModal';

/** Tela de biblioteca — reaproveita o ExercisePickerModal em modo "somente visualizar" (sem onSelect). */
export function ExerciseLibraryScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.fill}>
        <ExercisePickerModal visible onClose={() => navigation.goBack()} title="Biblioteca de exercícios" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
});
