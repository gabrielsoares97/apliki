/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { spacing } from '../theme';

interface PeekCarouselProps {
  children: React.ReactNode[];
  /** Quanto do proximo item aparece na lateral, como nas listas da Netflix. */
  peek?: number;
  gap?: number;
  onIndexChange?: (index: number) => void;
}

/** Carrossel horizontal com snap: cada item ocupa quase toda a largura e deixa um pedaco do proximo a mostra. */
export function PeekCarousel({ children, peek = 40, gap = spacing.sm + 2, onIndexChange }: PeekCarouselProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const items = React.Children.toArray(children);
  const itemWidth = Math.max(0, peek > 0 ? containerWidth - peek - gap : containerWidth);
  const interval = itemWidth + gap;

  function handleLayout(e: LayoutChangeEvent) {
    setContainerWidth(e.nativeEvent.layout.width);
  }

  return (
    <View onLayout={handleLayout}>
      {containerWidth > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingRight: peek }}
          onMomentumScrollEnd={(e) => onIndexChange?.(Math.round(e.nativeEvent.contentOffset.x / interval))}
        >
          {items.map((child, i) => (
            <View key={i} style={[styles.item, { width: itemWidth, marginRight: i === items.length - 1 ? 0 : gap }]}>
              {child}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignSelf: 'flex-start' },
});
