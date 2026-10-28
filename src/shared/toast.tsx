/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from './theme';

interface ToastOptions {
  /** Texto do botao (ex.: "Desfazer"). */
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastRequest extends ToastOptions {
  id: number;
  message: string;
}

let nextId = 1;
let listener: ((toast: ToastRequest | null) => void) | null = null;

/** Aviso leve que some sozinho; o mais novo substitui o anterior. Nao exige nenhum toque. */
export function showToast(message: string, options: ToastOptions = {}) {
  listener?.({ id: nextId++, message, ...options });
}

const DEFAULT_DURATION = 3200;
const DEFAULT_DURATION_WITH_ACTION = 5000;

/**
 * Distancia do toast ate a borda de baixo (alem da area segura). O botao "+" (QuickAddFab) ocupa
 * de ~80px (64 da barra de abas + 16) ate ~138px (+58 de altura); o toast fica logo acima dele.
 */
const TOAST_BOTTOM_OFFSET = 150;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastRequest | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity]);

  useEffect(() => {
    listener = (next) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(next);
    };
    return () => {
      listener = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    // No Android o accessibilityLiveRegion ja anuncia; no iOS e preciso pedir o anuncio.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.message);
    timerRef.current = setTimeout(hide, toast.durationMs ?? (toast.actionLabel ? DEFAULT_DURATION_WITH_ACTION : DEFAULT_DURATION));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast, opacity, hide]);

  if (!toast) return null;

  const translateY = opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + TOAST_BOTTOM_OFFSET }]}>
      <Animated.View
        style={[styles.toast, { opacity, transform: [{ translateY }] }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        {!!toast.actionLabel && (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            onPress={() => {
              toast.onAction?.();
              if (timerRef.current) clearTimeout(timerRef.current);
              hide();
            }}
          >
            <Text style={styles.action}>{toast.actionLabel}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md + 4,
    maxWidth: '100%',
    ...shadow,
    shadowOpacity: 0.25,
    elevation: 6,
  },
  message: { flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  action: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
