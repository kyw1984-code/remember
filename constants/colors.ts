const base = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textMuted: '#9CA3AF',
};

export const LightColors = {
  ...base,
  primaryBg: '#EEF2FF',
  successBg: '#D1FAE5',
  warningBg: '#FEF3C7',
  dangerBg: '#FEE2E2',
  streakBg: '#FFF7ED',
  streakAccent: '#EA580C',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  background: '#F9FAFB',
  surface: '#FFFFFF',
} as const;

export const DarkColors = {
  ...base,
  primaryBg: '#1E1B4B',
  successBg: '#064E3B',
  warningBg: '#451A03',
  dangerBg: '#450A0A',
  streakBg: '#2D1B0E',
  streakAccent: '#F97316',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  background: '#0F172A',
  surface: '#1E293B',
} as const;

export const Colors = LightColors;
export type AppColors = typeof LightColors;
