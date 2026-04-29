export const Colors = {
  bg: '#0D0D0D',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  border: '#3A3A3C',
  accent: '#D4FF00',
  accentDim: '#A8CC00',
  blue: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',
  clay: '#C2693A',
  hard: '#4A7FC1',
  grass: '#4CAF50',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Font = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 48,
};

export const SurfaceColors: Record<string, string> = {
  clay: Colors.clay,
  hard: Colors.hard,
  grass: Colors.grass,
};

export const SURFACE_LABELS: Record<string, string> = {
  clay: 'Saibro',
  hard: 'Duro',
  grass: 'Grama',
};

export const ENVIRONMENT_LABELS: Record<string, string> = {
  outdoor: 'Outdoor',
  indoor: 'Indoor',
};

export const HAND_LABELS: Record<string, string> = {
  right: 'Destro',
  left: 'Canhoto',
};

export const PLAY_STYLE_LABELS: Record<string, string> = {
  serve_volley: 'Saque-Voleio',
  defensive: 'Defensivo',
  all_court: 'All-Court',
  offensive: 'Ofensivo',
};
