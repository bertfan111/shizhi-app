import type { Character, Dataset } from '../types';

/**
 * 加载预生成的识字数据集。
 * 数据集文件位于 assets/data/characters.json，由 scripts/build-dataset.ts 离线生成。
 *
 * 注意：require 是同步且会被 Metro 打包到 App 内，保证完全离线可用。
 */
let cached: Character[] | null = null;

export function loadCharacters(): Character[] {
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require('../../assets/data/characters.json') as Dataset | Character[];
    if (Array.isArray(data)) {
      cached = data;
    } else if (data && Array.isArray((data as Dataset).characters)) {
      cached = (data as Dataset).characters;
    } else {
      cached = [];
    }
  } catch (e) {
    console.warn('未找到 characters.json，使用空数组占位。请先运行 npm run build:dataset。', e);
    cached = [];
  }
  return cached;
}

export function findCharacter(char: string): Character | undefined {
  return loadCharacters().find((c) => c.char === char);
}

export function indexOfChar(char: string): number {
  return loadCharacters().findIndex((c) => c.char === char);
}
