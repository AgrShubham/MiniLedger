export interface ThemeColors {
  background: string;
  card: string;
  cardHover: string;
  surfaceInput: string;
  surfaceMuted: string;
  border: string;
  borderLight: string;

  // Brand primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;

  // Status colors
  success: string;
  successBg: string;
  successLight: string;
  successBorder: string;
  successText: string;

  danger: string;
  dangerBg: string;
  dangerLight: string;
  dangerBorder: string;
  dangerCard: string;
  dangerText: string;

  warning: string;
  warningBg: string;
  warningText: string;
  warningBorder: string;

  // Avatars
  avatarBg: string;
  avatarText: string;
  avatarOverdueBg: string;
  avatarOverdueText: string;
  avatarRepaidBg: string;
  avatarRepaidText: string;

  // Action buttons
  actionEditBg: string;
  actionEditBorder: string;
  actionEditText: string;
  actionReceiptBg: string;
  actionReceiptBorder: string;
  actionReceiptText: string;

  // Notice box
  noticeBg: string;
  noticeBorder: string;
  noticeTitle: string;
  noticeText: string;

  // Text & neutral
  text: string;
  textMuted: string;
  textDim: string;
  placeholder: string;
  white: string;
  black: string;
}

export const darkColors: ThemeColors = {
  background: '#0F172A', // Slate 900
  card: '#1E293B',       // Slate 800
  cardHover: '#334155',  // Slate 700
  surfaceInput: '#0F172A',
  surfaceMuted: '#0F172A',
  border: '#334155',
  borderLight: '#475569',

  // Brand primary
  primary: '#6366F1',    // Indigo 500
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  primaryBg: '#1E1B4B',

  // Status colors
  success: '#10B981',    // Emerald 500
  successBg: '#064E3B',  // Emerald 900
  successLight: '#34D399',
  successBorder: '#065F46',
  successText: '#A7F3D0',

  danger: '#EF4444',     // Red 500
  dangerBg: '#7F1D1D',   // Red 900
  dangerLight: '#F87171',
  dangerBorder: '#991B1B',
  dangerCard: '#1E161C', // Dark reddish tint
  dangerText: '#FECACA',

  warning: '#F59E0B',    // Amber 500
  warningBg: '#78350F',  // Amber 900
  warningText: '#FDE68A',
  warningBorder: '#92400E',

  // Avatars
  avatarBg: '#3730A3',
  avatarText: '#FFFFFF',
  avatarOverdueBg: '#7F1D1D',
  avatarOverdueText: '#FECACA',
  avatarRepaidBg: '#064E3B',
  avatarRepaidText: '#A7F3D0',

  // Action buttons
  actionEditBg: '#0F172A',
  actionEditBorder: '#334155',
  actionEditText: '#94A3B8',
  actionReceiptBg: '#1E1B4B',
  actionReceiptBorder: '#3730A3',
  actionReceiptText: '#818CF8',

  // Notice box
  noticeBg: '#1E1B4B',
  noticeBorder: '#3730A3',
  noticeTitle: '#818CF8',
  noticeText: '#C7D2FE',

  // Text & neutral
  text: '#F8FAFC',       // Slate 50
  textMuted: '#94A3B8',  // Slate 400
  textDim: '#64748B',    // Slate 500
  placeholder: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC', // Slate 50 - gentle, warm off-white (never blinding)
  card: '#FFFFFF',       // Clean card surface
  cardHover: '#F1F5F9',  // Slate 100
  surfaceInput: '#F8FAFC',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',     // Slate 200 - soft, delicate divider
  borderLight: '#CBD5E1', // Slate 300

  // Brand primary
  primary: '#4F46E5',    // Indigo 600 - rich, elegant, readable
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',  // Indigo 50

  // Status colors - soft pastel tints with clear readable text
  success: '#059669',    // Emerald 600
  successBg: '#ECFDF5',  // Emerald 50
  successLight: '#059669',
  successBorder: '#A7F3D0',
  successText: '#065F46',

  danger: '#E11D48',     // Rose 600
  dangerBg: '#FFF1F2',   // Rose 50
  dangerLight: '#E11D48',
  dangerBorder: '#FECDD3',
  dangerCard: '#FFF5F5', // Very gentle warm rose tint
  dangerText: '#9F1239',

  warning: '#D97706',    // Amber 600
  warningBg: '#FFFBEB',  // Amber 50
  warningText: '#92400E',
  warningBorder: '#FDE68A',

  // Avatars
  avatarBg: '#EEF2FF',
  avatarText: '#4338CA',
  avatarOverdueBg: '#FFE4E6',
  avatarOverdueText: '#BE123C',
  avatarRepaidBg: '#D1FAE5',
  avatarRepaidText: '#047857',

  // Action buttons
  actionEditBg: '#F1F5F9',
  actionEditBorder: '#E2E8F0',
  actionEditText: '#475569',
  actionReceiptBg: '#EEF2FF',
  actionReceiptBorder: '#C7D2FE',
  actionReceiptText: '#4F46E5',

  // Notice box
  noticeBg: '#EEF2FF',
  noticeBorder: '#C7D2FE',
  noticeTitle: '#3730A3',
  noticeText: '#312E81',

  // Text & neutral - soft slate tones, avoids harsh pure black
  text: '#1E293B',       // Slate 800 - soft charcoal
  textMuted: '#64748B',  // Slate 500
  textDim: '#94A3B8',    // Slate 400
  placeholder: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
};

const commonSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const commonBorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof commonSpacing;
  borderRadius: typeof commonBorderRadius;
}

export const getTheme = (isDark: boolean): AppTheme => ({
  isDark,
  colors: isDark ? darkColors : lightColors,
  spacing: commonSpacing,
  borderRadius: commonBorderRadius,
});

// Default fallback export matching dark theme for backward compatibility
export const theme: AppTheme = getTheme(true);
