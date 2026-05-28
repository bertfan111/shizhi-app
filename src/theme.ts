/**
 * 全局主题：3D 玩具风 (Award-Winning Kids App Style)
 */

export const FONT_HANZI = 'LXGWWenKaiLite';
export const FONT_PINYIN = 'LXGWWenKaiLite';

export const COLORS = {
  // 背景色：非常柔和的偏暖米白，保护视力且不抢戏
  bg: '#F8F9FA',
  card: '#FFFFFF',

  // 玩具积木色系 (主色 + 底部厚度阴影色)
  toyBlue: { base: '#3B82F6', shadow: '#1D4ED8', light: '#DBEAFE' },
  toyPink: { base: '#F43F5E', shadow: '#BE123C', light: '#FFE4E6' },
  toyGreen: { base: '#10B981', shadow: '#047857', light: '#D1FAE5' },
  toyOrange: { base: '#F59E0B', shadow: '#B45309', light: '#FEF3C7' },
  toyPurple: { base: '#8B5CF6', shadow: '#5B21B6', light: '#EDE9FE' },

  // 通用/基础
  primary: '#F59E0B',
  primaryDeep: '#B45309',
  secondary: '#3B82F6',
  accent: '#F43F5E',
  
  // 边框和占位
  border: '#E5E7EB',
  borderSoft: '#F3F4F6',

  // 文本色：拒绝纯黑，使用圆润的深灰
  text: '#1F2937',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
};

// 统一定义的大圆角
export const RADIUS = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  pill: 999,
};
