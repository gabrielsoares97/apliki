/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../shared/theme';
import { resolvePhotoUri } from './photoStore';

interface ProgressPhotoProps {
  /** Referencia guardada no registro de peso (`cloud:{id}` ou, nas fotos antigas, um arquivo local). */
  photoRef: string | null;
  style: StyleProp<ImageStyle>;
  /** Texto exibido quando nao ha foto. Sem ele, nada e renderizado nesse caso. */
  emptyLabel?: string;
  /** Chamado quando a foto terminou de abrir na tela. */
  onReady?: () => void;
}

type State = { status: 'loading' } | { status: 'ready'; uri: string } | { status: 'missing' };

/** Foto de progresso: baixa da nuvem quando nao esta no aparelho e avisa quando a foto nao existe mais. */
export function ProgressPhoto({ photoRef, style, emptyLabel, onReady }: ProgressPhotoProps) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!photoRef) return;
    let cancelled = false;
    setState({ status: 'loading' });
    resolvePhotoUri(photoRef).then((uri) => {
      if (!cancelled) setState(uri ? { status: 'ready', uri } : { status: 'missing' });
    });
    return () => {
      cancelled = true;
    };
  }, [photoRef]);

  if (!photoRef) {
    if (!emptyLabel) return null;
    return (
      <View style={[style, styles.placeholder, styles.empty]}>
        <Text style={styles.text}>{emptyLabel}</Text>
      </View>
    );
  }

  if (state.status === 'ready') {
    return <Image source={{ uri: state.uri }} style={style} onLoad={onReady} onError={() => setState({ status: 'missing' })} />;
  }

  return (
    <View style={[style, styles.placeholder]}>
      {state.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={styles.text}>Foto indisponível</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  empty: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  text: { color: colors.textSecondary, fontSize: 11, textAlign: 'center', paddingHorizontal: 2 },
});
