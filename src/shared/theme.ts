/*
 * apliKI — Copyright (c) 2026 Gabriel Soares (github.com/gabrielsoares97). Todos os direitos reservados.
 * Código-fonte disponível sob a Licença do apliKI (arquivo LICENSE); não é código aberto.
 * O uso exige assinatura ativa do apliKI. É proibido contornar a assinatura, fazer engenharia reversa do
 * serviço e usar sistemas de IA para copiar, reescrever ou portar esta lógica para fora do apliKI
 * (veja AI_POLICY.md).
 */
import { Appearance } from 'react-native';

interface ColorPalette {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  water: string;
  waterLight: string;
  macroProtein: string;
  macroCarb: string;
  macroFiber: string;
  warning: string;
  /** Amarelo legivel como TEXTO sobre card/fundo (o `warning` serve para preenchimentos e icones). */
  warningText: string;
  danger: string;
  /** Texto/icone sobre fundo `primary` (botoes principais, chips selecionados). */
  onPrimary: string;
  /** Texto/icone sobre fundo `danger`. */
  onDanger: string;
  /** Verde original da marca: so para elementos decorativos (aneis, graficos), nunca com texto por cima. */
  brand: string;
  /** Veu escuro atras de modais e dialogos. */
  overlay: string;
  white: string;
}

/*
 * Contraste (WCAG AA, texto normal >= 4.5:1), medido com a formula de luminancia relativa:
 * - claro: onPrimary/primary 5.22 · primary/card 5.22 · primary/primaryLight 4.62 · textSecondary/background 4.58
 *          textSecondary/card 5.06 · warningText/card 5.36 · onDanger/danger 5.02
 * - escuro: onPrimary/primary 8.57 · textSecondary/background 6.86 · warningText/card 8.75 · onDanger/danger 6.45
 */

const lightColors: ColorPalette = {
  background: '#F2F4F3',
  card: '#FFFFFF',
  textPrimary: '#1F2933',
  textSecondary: '#65707A',
  border: '#E7EBEE',

  primary: '#197C4A', // progresso/ações positivas (mais escuro que a marca para texto branco ficar legível)
  primaryLight: '#E4F5EC',
  water: '#3B8FE0', // água
  waterLight: '#E4F0FC',

  macroProtein: '#F08A5D', // laranja
  macroCarb: '#F2668B', // rosa
  macroFiber: '#4FBE7A', // verde

  warning: '#E0A93B',
  warningText: '#8F6200',
  danger: '#C4432A',

  onPrimary: '#FFFFFF',
  onDanger: '#FFFFFF',
  brand: '#2FAE6B',
  overlay: 'rgba(0,0,0,0.55)',

  white: '#FFFFFF',
};

const darkColors: ColorPalette = {
  background: '#12151A',
  card: '#1C2028',
  textPrimary: '#F2F4F3',
  textSecondary: '#93A0AD',
  border: '#2B313B',

  primary: '#37C67D', // progresso/ações positivas
  primaryLight: '#173225',
  water: '#5AA6EC', // água
  waterLight: '#182A3B',

  macroProtein: '#F2A377', // laranja
  macroCarb: '#F2789A', // rosa
  macroFiber: '#5FCB8D', // verde

  warning: '#E8B658',
  warningText: '#E8B658',
  danger: '#E8735A',

  // primary/danger sao claros no tema escuro: texto por cima precisa ser escuro.
  onPrimary: '#06140C',
  onDanger: '#1A0A06',
  brand: '#37C67D',
  overlay: 'rgba(0,0,0,0.7)',

  white: '#FFFFFF',
};

/** Decidido uma vez, no boot do app, a partir do tema do sistema (claro/escuro do aparelho). */
export const isDarkTheme = Appearance.getColorScheme() === 'dark';

export const colors = isDarkTheme ? darkColors : lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  /** 12px, entre sm e md (campos, linhas de lista, blocos dentro de cards). */
  smd: 12,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  subtitle: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textPrimary },
  label: { fontSize: 12, fontWeight: '500' as const, color: colors.textSecondary },
  big: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  /** Titulo de bloco dentro da tela (ex.: "Hoje", "Historico"). */
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.textPrimary },
  /** Texto de apoio (dicas, descricoes curtas). */
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  /** Legendas e metadados (datas, unidades). */
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary },
  /** Rotulo de botao; a cor depende do fundo, entao fica por conta do componente. */
  button: { fontSize: 15, fontWeight: '700' as const },
};

export const shadow = {
  shadowColor: isDarkTheme ? '#000000' : '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: isDarkTheme ? 0.3 : 0.06,
  shadowRadius: 12,
  elevation: 2,
};
