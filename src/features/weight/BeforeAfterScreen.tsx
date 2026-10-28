/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, PixelRatio, LayoutChangeEvent } from 'react-native';
import { ProgressPhoto } from './ProgressPhoto';
import { Alert } from '../../shared/dialog';
import { showToast } from '../../shared/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Card } from '../../shared/components/Card';
import { CardAction } from '../../shared/components/CardParts';
import { Button } from '../../shared/components/Button';
import { EmptyState } from '../../shared/components/EmptyState';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { weightRepository } from '../../db/repositories';
import { PhotoAngle, WeightLog } from '../../types';
import { formatShortDatePt } from '../../shared/date';

const ANGLES: { key: PhotoAngle; label: string }[] = [
  { key: 'front', label: 'Frente' },
  { key: 'side', label: 'Lado' },
  { key: 'back', label: 'Costas' },
];

/** Imagem gerada: duas fotos 3:4 lado a lado (1080 x 1440 px cada), sem ampliar as fotos guardadas. */
const EXPORT_WIDTH = 2160;
const EXPORT_HEIGHT = 1440;
/** A versão de exportação é montada fora da tela já no tamanho final, em pontos de layout. */
const EXPORT_LAYOUT_WIDTH = EXPORT_WIDTH / PixelRatio.get();

function angleUri(log: WeightLog, angle: PhotoAngle): string | null {
  if (angle === 'front') return log.photoFrontUri;
  if (angle === 'side') return log.photoSideUri;
  return log.photoBackUri;
}

/** Salva na galeria do aparelho. False se a permissao foi negada ou o aparelho nao suporta. */
async function saveToGallery(uri: string): Promise<boolean> {
  try {
    // No Android 10+ gravar na galeria nao exige permissao (o pedido so vale para versoes antigas e iOS),
    // entao o resultado do pedido nao decide: quem decide e a gravacao em si.
    // Carregado sob demanda: o modulo nativo nao existe na web e, importado no topo, derrubava o app inteiro la.
    const { Asset, requestPermissionsAsync } = await import('expo-media-library');
    await requestPermissionsAsync(true, ['photo']).catch(() => undefined);
    await Asset.create(uri);
    return true;
  } catch {
    return false;
  }
}

export function BeforeAfterScreen() {
  const [logsWithPhotos, setLogsWithPhotos] = useState<WeightLog[]>([]);
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<'before' | 'after' | null>(null);
  const [busy, setBusy] = useState(false);
  const [readyAngles, setReadyAngles] = useState<PhotoAngle[]>([]);
  const compositeRefs = useRef<Partial<Record<PhotoAngle, View | null>>>({});
  const exportRefs = useRef<Partial<Record<PhotoAngle, View | null>>>({});
  const [exportReadyAngles, setExportReadyAngles] = useState<PhotoAngle[]>([]);
  // Espelho para o captureAngle esperar a versão em tamanho final sem depender de um render novo.
  const exportReadyRef = useRef<PhotoAngle[]>([]);
  exportReadyRef.current = exportReadyAngles;

  const load = useCallback(async () => {
    const all = await weightRepository.listAll();
    const withPhotos = all.filter((l) => l.photoFrontUri || l.photoSideUri || l.photoBackUri);
    setLogsWithPhotos(withPhotos);
    if (withPhotos.length >= 2) {
      setBeforeId((prev) => prev ?? withPhotos[withPhotos.length - 1].id);
      setAfterId((prev) => prev ?? withPhotos[0].id);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Trocar as datas recarrega as fotos: so libera o download de novo quando elas terminarem de abrir.
  useEffect(() => {
    setReadyAngles([]);
    setExportReadyAngles([]);
  }, [beforeId, afterId]);

  const beforeLog = logsWithPhotos.find((l) => l.id === beforeId) ?? null;
  const afterLog = logsWithPhotos.find((l) => l.id === afterId) ?? null;

  function selectFor(kind: 'before' | 'after', log: WeightLog) {
    if (kind === 'before') setBeforeId(log.id);
    else setAfterId(log.id);
    setPickerFor(null);
  }

  const markReady = useCallback((angle: PhotoAngle) => {
    setReadyAngles((prev) => (prev.includes(angle) ? prev : [...prev, angle]));
  }, []);

  const markExportReady = useCallback((angle: PhotoAngle) => {
    setExportReadyAngles((prev) => (prev.includes(angle) ? prev : [...prev, angle]));
  }, []);

  /**
   * Gera a imagem 50/50 do angulo a partir da versao montada fora da tela no tamanho final, entao nada e
   * ampliado. Se ela ainda nao abriu as fotos (ou falhar), usa a previa da tela como antes.
   */
  async function captureAngle(angle: PhotoAngle): Promise<string> {
    const options = { format: 'jpg' as const, quality: 0.92, width: EXPORT_WIDTH, height: EXPORT_HEIGHT };
    // A versão grande pode levar um instante a mais para abrir as fotos: espera até ~4 s antes de desistir dela.
    for (let i = 0; i < 20 && !exportReadyRef.current.includes(angle); i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    const exportView = exportRefs.current[angle];
    if (exportView && exportReadyRef.current.includes(angle)) {
      try {
        return await captureRef(exportView, options);
      } catch {
        // segue para a previa
      }
    }
    const view = compositeRefs.current[angle];
    if (!view) throw new Error('Imagem indisponível.');
    return captureRef(view, options);
  }

  async function handleDownload(angles: PhotoAngle[]) {
    if (busy || angles.length === 0) return;
    setBusy(true);
    try {
      let saved = 0;
      for (const angle of angles) {
        if (await saveToGallery(await captureAngle(angle))) saved += 1;
      }
      if (saved === angles.length) {
        showToast(saved === 1 ? 'Imagem salva na galeria ✓' : `${saved} imagens salvas na galeria ✓`);
      } else {
        Alert.alert(
          'Não foi possível salvar na galeria',
          'Libere o acesso às fotos para o apliKI nos ajustes do aparelho, ou use "Compartilhar" para enviar a imagem para outro app.'
        );
      }
    } catch {
      Alert.alert('Não foi possível gerar a imagem', 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function handleShare(angle: PhotoAngle) {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureAngle(angle);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Compartilhar antes e depois' });
      } else {
        Alert.alert('Não disponível', 'O compartilhamento não está disponível neste dispositivo.');
      }
    } catch {
      Alert.alert('Não foi possível gerar a imagem', 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  // So da para montar o antes/depois de um angulo quando as duas datas tem foto dele.
  const comparableAngles =
    beforeLog && afterLog ? ANGLES.filter(({ key }) => angleUri(beforeLog, key) && angleUri(afterLog, key)).map((a) => a.key) : [];
  const kitReady = comparableAngles.length > 0 && comparableAngles.every((angle) => readyAngles.includes(angle));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Compare duas datas lado a lado e baixe as imagens prontas para guardar ou compartilhar.
        </Text>

        {logsWithPhotos.length < 2 ? (
          <Card>
            <EmptyState
              icon="📸"
              title="Ainda não dá para comparar"
              description="Registre pelo menos duas fotos de progresso (em datas diferentes) ao salvar seu peso para poder comparar."
            />
          </Card>
        ) : (
          <>
            <View style={styles.selectorRow}>
              <SelectorButton label="Antes" log={beforeLog} onPress={() => setPickerFor('before')} />
              <Text style={styles.arrow}>→</Text>
              <SelectorButton label="Agora" log={afterLog} onPress={() => setPickerFor('after')} />
            </View>

            {comparableAngles.length > 1 && (
              <Button
                label={`⬇ Baixar kit completo (${comparableAngles.length} imagens)`}
                accessibilityLabel={
                  busy ? 'Gerando imagens' : `Baixar kit completo, ${comparableAngles.length} imagens`
                }
                onPress={() => handleDownload(comparableAngles)}
                disabled={!kitReady}
                loading={busy}
                style={styles.kitButton}
              />
            )}

            {beforeLog && afterLog && (
              <View style={{ marginTop: spacing.lg }}>
                {ANGLES.map(({ key, label }) => {
                  const beforeUri = angleUri(beforeLog, key);
                  const afterUri = angleUri(afterLog, key);
                  if (!beforeUri && !afterUri) return null;
                  const comparable = comparableAngles.includes(key);
                  const ready = readyAngles.includes(key);
                  return (
                    <Card key={key} style={{ marginBottom: spacing.md }}>
                      <View style={styles.cardHeader}>
                        <Text style={typography.subtitle}>{label}</Text>
                        {comparable && (
                          <View style={[styles.cardActions, (!ready || busy) && styles.disabled]} pointerEvents={ready && !busy ? 'auto' : 'none'}>
                            <CardAction label="Compartilhar" onPress={() => handleShare(key)} />
                            <CardAction label="⬇ Baixar" variant="solid" onPress={() => handleDownload([key])} />
                          </View>
                        )}
                      </View>

                      <Composite
                        // Refaz o componente quando as fotos mudam, para a contagem de fotos abertas recomecar.
                        key={`${beforeUri}|${afterUri}`}
                        viewRef={(view) => {
                          compositeRefs.current[key] = view;
                        }}
                        before={{ uri: beforeUri, log: beforeLog }}
                        after={{ uri: afterUri, log: afterLog }}
                        onReady={() => markReady(key)}
                      />

                      {!comparable && (
                        <Text style={styles.missingNote}>
                          Para baixar este ângulo, as duas datas precisam ter a foto de {label.toLowerCase()}.
                        </Text>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Versões de exportação, fora da área visível: mesmo desenho da prévia, já no tamanho final. */}
      {beforeLog && afterLog && (
        <View style={styles.exportLayer} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {comparableAngles.map((key) => {
            const beforeUri = angleUri(beforeLog, key);
            const afterUri = angleUri(afterLog, key);
            return (
              <Composite
                key={`${key}|${beforeUri}|${afterUri}`}
                width={EXPORT_LAYOUT_WIDTH}
                viewRef={(view) => {
                  exportRefs.current[key] = view;
                }}
                before={{ uri: beforeUri, log: beforeLog }}
                after={{ uri: afterUri, log: afterLog }}
                onReady={() => markExportReady(key)}
              />
            );
          })}
        </View>
      )}

      <ModalSheet visible={pickerFor !== null} title="Escolha a data" onClose={() => setPickerFor(null)}>
        {logsWithPhotos.map((log) => (
          <Pressable
            key={log.id}
            style={styles.dateRow}
            onPress={() => selectFor(pickerFor!, log)}
            accessibilityRole="button"
            accessibilityLabel={`${formatShortDatePt(new Date(log.dateTime))}, ${log.weightKg} kg`}
          >
            <Text style={styles.dateRowWeight}>{log.weightKg} kg</Text>
            <Text style={styles.dateRowDate}>{formatShortDatePt(new Date(log.dateTime))}</Text>
          </Pressable>
        ))}
      </ModalSheet>
    </SafeAreaView>
  );
}

interface CompositeSide {
  uri: string | null;
  log: WeightLog;
}

interface CompositeProps {
  viewRef: (view: View | null) => void;
  before: CompositeSide;
  after: CompositeSide;
  /** Chamado quando as duas fotos terminaram de abrir (a imagem ja pode ser gerada). */
  onReady: () => void;
  /** Largura fixa em pontos (versao de exportacao). Sem ela, ocupa a largura disponivel (previa). */
  width?: number;
}

/**
 * Etiquetas proporcionais a largura de cada metade, para a previa e a imagem baixada ficarem identicas.
 * Tamanhos discretos: o destaque e a foto, nao o texto.
 */
function overlaySizes(halfWidth: number) {
  const u = halfWidth / 100;
  return {
    tag: { top: 3 * u, paddingHorizontal: 2.6 * u, paddingVertical: 0.9 * u },
    tagText: { fontSize: 3.4 * u, letterSpacing: 0.5 * u },
    caption: { bottom: 3 * u, paddingHorizontal: 2.4 * u, paddingVertical: 0.9 * u },
    captionText: { fontSize: 3 * u },
  };
}

/** A imagem que e baixada: as duas fotos ocupando tudo, metade cada, com "ANTES" e "AGORA" por cima. */
function Composite({ viewRef, before, after, onReady, width }: CompositeProps) {
  const loaded = useRef(0);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const handleLoaded = () => {
    loaded.current += 1;
    if (loaded.current >= 2) onReady();
  };

  const totalWidth = width ?? measuredWidth;
  const dividerWidth = totalWidth ? Math.max(1, totalWidth * 0.002) : 1;
  const sizes = totalWidth ? overlaySizes((totalWidth - dividerWidth) / 2) : null;

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={[styles.composite, width ? { width, height: (width * 2) / 3 } : null]}
      onLayout={width ? undefined : (e: LayoutChangeEvent) => setMeasuredWidth(e.nativeEvent.layout.width)}
    >
      <CompositeHalf tag="ANTES" side={before} sizes={sizes} onLoaded={handleLoaded} />
      <View style={[styles.divider, { width: dividerWidth }]} />
      <CompositeHalf tag="AGORA" side={after} sizes={sizes} onLoaded={handleLoaded} />
    </View>
  );
}

function CompositeHalf({
  tag,
  side,
  sizes,
  onLoaded,
}: {
  tag: string;
  side: CompositeSide;
  sizes: ReturnType<typeof overlaySizes> | null;
  onLoaded: () => void;
}) {
  return (
    <View style={styles.half}>
      <ProgressPhoto photoRef={side.uri} style={styles.halfImage} emptyLabel="Sem foto" onReady={onLoaded} />
      {sizes && (
        <>
          <View style={[styles.tag, sizes.tag]}>
            <Text style={[styles.tagText, sizes.tagText]} allowFontScaling={false}>
              {tag}
            </Text>
          </View>
          <View style={[styles.caption, sizes.caption]}>
            <Text style={[styles.captionText, sizes.captionText]} allowFontScaling={false}>
              {formatShortDatePt(new Date(side.log.dateTime))} · {side.log.weightKg} kg
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

function SelectorButton({ label, log, onPress }: { label: string; log: WeightLog | null; onPress: () => void }) {
  return (
    <Pressable
      style={styles.selectorButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${log ? formatShortDatePt(new Date(log.dateTime)) : 'nenhuma data'}`}
      accessibilityHint="Trocar data"
    >
      <Text style={styles.selectorLabel}>{label}</Text>
      <Text style={styles.selectorValue}>{log ? formatShortDatePt(new Date(log.dateTime)) : 'Selecionar'}</Text>
      {log && <Text style={styles.selectorWeight}>{log.weightKg} kg</Text>}
      <Text style={styles.selectorChange}>Trocar data</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kitButton: { marginTop: spacing.md },
  disabled: { opacity: 0.5 },
  arrow: { fontSize: 20, color: colors.textSecondary },
  selectorButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  selectorLabel: { ...typography.caption },
  selectorValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  selectorWeight: { ...typography.caption, marginTop: 2 },
  selectorChange: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  // Proporcao 3:2 = duas fotos 3:4 lado a lado. Sem cantos arredondados nem margens: tudo aqui vai para a imagem.
  composite: { flexDirection: 'row', width: '100%', aspectRatio: 3 / 2, backgroundColor: '#000000' },
  half: { flex: 1, overflow: 'hidden' },
  halfImage: { width: '100%', height: '100%' },
  divider: { backgroundColor: '#FFFFFF' },
  // Tamanhos de fonte e espacos vem de overlaySizes(); aqui so a aparencia.
  tag: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: radius.full },
  tagText: { color: '#FFFFFF', fontWeight: '800' },
  caption: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: radius.full },
  captionText: { color: '#FFFFFF', fontWeight: '600' },
  // Fora da area visivel, mas montada (o captureRef precisa da view desenhada).
  exportLayer: { position: 'absolute', left: -100000, top: 0 },
  missingNote: { ...typography.caption, marginTop: spacing.sm },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  dateRowWeight: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  dateRowDate: { ...typography.small },
});
