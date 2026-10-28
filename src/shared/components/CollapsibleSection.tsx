/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface CollapsibleSectionProps {
  icon: string;
  title: string;
  /** Texto curto exibido ao lado do titulo quando fechado (ex.: "3 ativas"). */
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ icon, title, hint, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setOpen((v) => !v)} style={({ pressed }) => [styles.header, pressed && { opacity: 0.85 }]}>
        <View style={styles.iconBubble}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!hint && !open && <Text style={styles.hint}>{hint}</Text>}
        </View>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: spacing.sm + 2,
    overflow: 'hidden',
    ...shadow,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 17 },
  title: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  chevron: { fontSize: 24, color: colors.textSecondary, transform: [{ rotate: '0deg' }] },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
