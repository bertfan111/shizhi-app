/**
 * 用 pinyin-pro 给汉字 / 整段故事注音。
 * 输出"逐字注音"数组：标点的 pinyin 为 null。
 */
import { pinyin } from 'pinyin-pro';

export type PinyinChar = { char: string; pinyin: string | null };

// 单字主拼音（带声调，例 "tiān"）
export function getCharPinyin(char: string): string {
  return pinyin(char, { toneType: 'symbol', type: 'string', nonZh: 'consecutive' });
}

// 整段文字 -> 逐字 PinyinChar[]
export function annotateText(text: string): PinyinChar[] {
  // 用 pinyin-pro 的 array 模式拿到与字符等长的拼音数组
  const arr = pinyin(text, {
    toneType: 'symbol',
    type: 'array',
    nonZh: 'consecutive', // 非中文（标点 / 字母 / 数字）连续保留
  });
  const result: PinyinChar[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const p = arr[i];
    const isHanzi = /[\u4e00-\u9fff]/.test(c);
    result.push({
      char: c,
      pinyin: isHanzi ? p : null,
    });
  }
  return result;
}
