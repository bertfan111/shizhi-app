/**
 * 字符 → 图片资源映射表
 * ⚠️ 此文件由 scripts/build-images.ts 自动维护。
 *
 * 当前状态：早期生成的 695 张插图中，绝大多数为 GPT-image 调用失败后的占位副本；
 * 经去重清理后真正不同的内容只剩个位数。此映射只列出 assets/images 中实际存在的文件，
 * 其余汉字由 StoryImage 组件回退到「插图生成中…」占位 UI。
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map: Record<string, any> = {
  '我': require('../../assets/images/我.png'),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getImageFor(char: string): any | null {
  return map[char] ?? null;
}

export function hasImageFor(char: string): boolean {
  return Boolean(map[char]);
}
