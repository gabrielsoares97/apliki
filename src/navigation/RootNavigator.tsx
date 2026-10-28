/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { QuickAddFab } from '../features/dashboard/QuickAddFab';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../shared/theme';
import { TabBarIcon, TabIconName } from '../shared/components/TabBarIcon';

import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { EloDetailScreen } from '../features/dashboard/EloDetailScreen';
import { WeightDetailScreen } from '../features/weight/WeightDetailScreen';
import { BeforeAfterScreen } from '../features/weight/BeforeAfterScreen';
import { NutritionScreen } from '../features/nutrition/NutritionScreen';
import { NutritionGoalsScreen } from '../features/nutrition/NutritionGoalsScreen';
import { DosesScreen } from '../features/dose/DosesScreen';
import { MedicationSettingsScreen } from '../features/dose/MedicationSettingsScreen';
import { SupplementRemindersScreen } from '../features/dose/SupplementRemindersScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { PrivacyPolicyScreen } from '../features/profile/PrivacyPolicyScreen';
import { WaterRemindersScreen } from '../features/water/WaterRemindersScreen';
import { WorkoutHomeScreen } from '../features/workout/WorkoutHomeScreen';
import { WorkoutBuilderScreen } from '../features/workout/WorkoutBuilderScreen';
import { MyWorkoutsScreen } from '../features/workout/MyWorkoutsScreen';
import { ActiveWorkoutScreen } from '../features/workout/ActiveWorkoutScreen';
import { QuickWorkoutScreen } from '../features/workout/QuickWorkoutScreen';
import { ProgramsScreen } from '../features/workout/ProgramsScreen';
import { SmartPlanScreen } from '../features/workout/SmartPlanScreen';
import { WorkoutProgressScreen } from '../features/workout/WorkoutProgressScreen';
import { ExerciseLibraryScreen } from '../features/workout/ExerciseLibraryScreen';

const InicioStack = createNativeStackNavigator();
const NutricaoStack = createNativeStackNavigator();
const DosesStack = createNativeStackNavigator();
const TreinoStack = createNativeStackNavigator();
const PerfilStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false } as const;

function InicioNavigator() {
  return (
    <InicioStack.Navigator screenOptions={screenOptions}>
      <InicioStack.Screen name="Dashboard" component={DashboardScreen} />
      <InicioStack.Screen name="EloDetail" component={EloDetailScreen} options={{ headerShown: true, title: 'Elo da saúde' }} />
      <InicioStack.Screen name="WeightDetail" component={WeightDetailScreen} options={{ headerShown: true, title: 'Peso' }} />
      <InicioStack.Screen name="BeforeAfter" component={BeforeAfterScreen} options={{ headerShown: true, title: 'Antes e depois' }} />
    </InicioStack.Navigator>
  );
}

function NutricaoNavigator() {
  return (
    <NutricaoStack.Navigator screenOptions={screenOptions}>
      <NutricaoStack.Screen name="Nutrition" component={NutritionScreen} />
      <NutricaoStack.Screen
        name="NutritionGoals"
        component={NutritionGoalsScreen}
        options={{ headerShown: true, title: 'Metas nutricionais' }}
      />
    </NutricaoStack.Navigator>
  );
}

function DosesNavigator() {
  return (
    <DosesStack.Navigator screenOptions={screenOptions}>
      <DosesStack.Screen name="DosesList" component={DosesScreen} />
      <DosesStack.Screen
        name="MedicationSettings"
        component={MedicationSettingsScreen}
        options={{ headerShown: true, title: 'Medicamento' }}
      />
      <DosesStack.Screen
        name="SupplementReminders"
        component={SupplementRemindersScreen}
        options={{ headerShown: true, title: 'Lembretes' }}
      />
    </DosesStack.Navigator>
  );
}

function TreinoNavigator() {
  return (
    <TreinoStack.Navigator screenOptions={screenOptions}>
      <TreinoStack.Screen name="WorkoutHome" component={WorkoutHomeScreen} />
      <TreinoStack.Screen name="WorkoutBuilder" component={WorkoutBuilderScreen} options={{ headerShown: true, title: 'Novo treino' }} />
      <TreinoStack.Screen name="MyWorkouts" component={MyWorkoutsScreen} options={{ headerShown: true, title: 'Meus treinos' }} />
      <TreinoStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: true, title: 'Treino em andamento' }} />
      <TreinoStack.Screen name="QuickWorkout" component={QuickWorkoutScreen} options={{ headerShown: true, title: 'Treino rápido' }} />
      <TreinoStack.Screen name="Programs" component={ProgramsScreen} options={{ headerShown: true, title: 'Programas' }} />
      <TreinoStack.Screen name="SmartPlan" component={SmartPlanScreen} options={{ headerShown: true, title: 'Plano automático' }} />
      <TreinoStack.Screen name="WorkoutProgress" component={WorkoutProgressScreen} options={{ headerShown: true, title: 'Progresso' }} />
      <TreinoStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} options={{ headerShown: true, title: 'Exercícios' }} />
    </TreinoStack.Navigator>
  );
}

function PerfilNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={screenOptions}>
      <PerfilStack.Screen name="Profile" component={ProfileScreen} />
      <PerfilStack.Screen
        name="WaterReminders"
        component={WaterRemindersScreen}
        options={{ headerShown: true, title: 'Lembretes de água' }}
      />
      <PerfilStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ headerShown: true, title: 'Privacidade' }}
      />
    </PerfilStack.Navigator>
  );
}

/** Icones SVG tingiveis: contorno na aba inativa, preenchido na ativa (antes eram emojis, que nao mudam de cor). */
const TAB_ICONS: Record<string, TabIconName> = {
  InicioTab: 'inicio',
  NutricaoTab: 'nutricao',
  TreinoTab: 'treino',
  DosesTab: 'doses',
  PerfilTab: 'perfil',
};

/** Telas onde o botao "+" atrapalha (registro em andamento / formularios de tela cheia). */
const FAB_HIDDEN_ROUTES = ['ActiveWorkout', 'WorkoutBuilder', 'PrivacyPolicy'];

export function RootNavigator() {
  // Fora de um navegador, useNavigation devolve a referencia do container raiz, que enxerga a rota focada.
  const rootNavigation = useNavigation<any>();
  const [fabHidden, setFabHidden] = useState(false);

  useEffect(() => {
    const update = () => setFabHidden(FAB_HIDDEN_ROUTES.includes(rootNavigation.getCurrentRoute?.()?.name));
    update();
    return rootNavigation.addListener('state', update);
  }, [rootNavigation]);

  return (
    <View style={{ flex: 1 }}>
      <TabNavigator />
      {!fabHidden && <QuickAddFab />}
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon name={TAB_ICONS[route.name]} focused={focused} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="InicioTab" component={InicioNavigator} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="NutricaoTab" component={NutricaoNavigator} options={{ tabBarLabel: 'Nutrição' }} />
      <Tab.Screen name="TreinoTab" component={TreinoNavigator} options={{ tabBarLabel: 'Treino' }} />
      <Tab.Screen name="DosesTab" component={DosesNavigator} options={{ tabBarLabel: 'Doses', tabBarAccessibilityLabel: 'Doses e lembretes' }} />
      <Tab.Screen name="PerfilTab" component={PerfilNavigator} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}
