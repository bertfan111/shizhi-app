/**
 * 兼容层：早期版本只存 last_index，这里改为只存 last_char。
 * 真实读写在 learningStore.ts，这里转一层方便老页面引用。
 */
import { loadLastChar, saveLastChar } from './learningStore';
import { indexOfChar, loadCharacters } from './loadCharacters';

export { saveLastChar, loadLastChar };

/** 兼容旧调用：返回上次字在字表中的索引；找不到则回 0 */
export async function loadLastIndex(): Promise<number> {
  const ch = await loadLastChar();
  if (!ch) return 0;
  const idx = indexOfChar(ch);
  return idx >= 0 ? idx : 0;
}

/** 兼容旧调用：把索引转字符存进去 */
export async function saveLastIndex(index: number): Promise<void> {
  const list = loadCharacters();
  if (index < 0 || index >= list.length) return;
  await saveLastChar(list[index].char);
}
