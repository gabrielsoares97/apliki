/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from './Button';

interface LoadingStateProps {
  /** Texto opcional abaixo do indicador (ex.: "Carregando seus registros..."). */
  message?: string;
  /** true (padrao) ocupa todo o espaco disponivel; false para usar dentro de cards. */
  fullScreen?: boolean;
  style?: ViewStyle;
}

/** Indicador de carregamento centralizado, com mensagem opcional. */
export function LoadingState({ message, fullScreen = true, style }: LoadingStateProps) {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Carregando'}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

interface ErrorStateProps {
  /** Titulo curto; padrao "Algo deu errado". */
  title?: string;
  /** Explicacao do que falhou (ex.: "Nao foi possivel carregar seus dados. Verifique sua conexao."). */
  message?: string;
  /** Quando informado, mostra o botao "Tentar novamente". */
  onRetry?: () => void;
  /** Rotulo do botao; padrao "Tentar novamente". */
  retryLabel?: string;
  /** Desabilita o botao e mostra carregamento enquanto tenta de novo. */
  retrying?: boolean;
  fullScreen?: boolean;
  style?: ViewStyle;
}

/** Falha ao carregar algo, com opcao de tentar de novo. */
export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  retrying,
  fullScreen = true,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]} accessibilityLiveRegion="polite">
      <Text style={styles.icon} importantForAccessibility="no" accessibilityElementsHidden>
        ⚠️
      </Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!onRetry && (
        <Button label={retryLabel} onPress={onRetry} loading={retrying} variant="secondary" size="sm" style={styles.retry} />
      )}
    </View>
  );
}

interface ScreenStateProps {
  loading?: boolean;
  /** Mensagem de erro; quando presente (e sem `loading`), mostra o ErrorState. */
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
}

/**
 * Atalho para telas que carregam dados: carregando -> LoadingState, erro -> ErrorState, senao o conteudo.
 * Ex.: <ScreenState loading={loading} error={error} onRetry={reload}>...</ScreenState>
 */
export function ScreenState({ loading, error, onRetry, loadingMessage, children }: ScreenStateProps) {
  if (loading) return <LoadingState message={loadingMessage} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  fullScreen: { flex: 1, backgroundColor: colors.background },
  icon: { fontSize: 32 },
  title: { ...typography.subtitle, textAlign: 'center' },
  message: { ...typography.small, textAlign: 'center', lineHeight: 19, maxWidth: 320 },
  retry: { marginTop: spacing.sm },
});
