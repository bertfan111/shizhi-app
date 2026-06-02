/**
 * 全局主题：淡黄色 + 淡蓝色渐变儿童风
 *
 * 参考喜马拉雅儿童图标的视觉语言：
 * - 大面积浅黄，明亮温暖
 * - 辅以浅蓝，清爽干净
 * - 控件保留 3D 厚度，但降低饱和度，避免刺眼
 */

export const FONT_HANZI = 'LXGWWenKaiLite';
export const FONT_PINYIN = 'LXGWWenKaiLite';

export const COLORS = {
  // 页面底色 fallback，真实页面会使用 GRADIENTS.page
  bg: '#FFF8D7',
  card: '#FFFFFF',

  // 淡黄 + 淡蓝玩具积木色系
  toyBlue: { base: '#69C7F7', shadow: '#2F97D8', light: '#DFF5FF' },
  toyPink: { base: '#FF9FB7', shadow: '#E35D7D', light: '#FFE8EF' },
  toyGreen: { base: '#7EDFA6', shadow: '#3CB978', light: '#E1F8EA' },
  toyOrange: { base: '#FFD45C', shadow: '#E7A923', light: '#FFF1B8' },
  toyPurple: { base: '#B9A8FF', shadow: '#8570E8', light: '#EFEAFF' },

  // 通用/基础
  primary: '#FFD45C',
  primaryDeep: '#A66B00',
  secondary: '#69C7F7',
  accent: '#FF8FA8',
  
  // 边框和占位
  border: '#F7D985',
  borderSoft: '#FFF0B3',

  // 文本色：拒绝纯黑，使用圆润的深灰
  text: '#3F3A2F',
  textMuted: '#8A7652',
  textLight: '#B6A783',
};

export const GRADIENTS = {
  page: ['#FFF9D8', '#EAF8FF'] as const,
  card: ['#FFFFFF', '#FFF7CF'] as const,
  tab: ['#FFF6C7', '#E7F7FF'] as const,
  yellowButton: ['#FFE98A', '#FFD45C'] as const,
  blueButton: ['#DDF6FF', '#8EDCFF'] as const,
};

// 统一定义的大圆角
export const RADIUS = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  pill: 999,
};
