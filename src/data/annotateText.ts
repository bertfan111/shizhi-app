import { pinyin } from 'pinyin-pro';
import type { PinyinChar } from '../types';

const HANZI_RE = /[\u4e00-\u9fff]/;

export function annotateText(text: string): PinyinChar[] {
  return Array.from(text).map((char) => ({
    char,
    pinyin: HANZI_RE.test(char)
      ? pinyin(char, { toneType: 'symbol', type: 'string' })
      : null,
  }));
}
