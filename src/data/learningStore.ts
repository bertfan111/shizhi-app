/**
 * 学习状态存储：单字进度 + 最近接触字 + 计算派生集合（错字本、今日复习、最近学过…）。
 *
 * 数据全部存在本机 AsyncStorage，App 完全离线工作。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CharacterProgress,
  LearningStatus,
  ProgressStats,
} from '../types';
import { loadCharacters } from './loadCharacters';

const KEY_PROGRESS = 'shizi:progress:v1';
const KEY_LAST_CHAR = 'shizi:last_char:v1';
const KEY_RECENT_CHARS = 'shizi:recent_chars:v1';
const RECENT_MAX = 12;
const FOLLOW_READ_HISTORY_MAX = 20;

const ONE_DAY = 24 * 60 * 60 * 1000;

type ProgressMap = Record<string, CharacterProgress>;

let memCache: ProgressMap | null = null;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      /* 忽略 */
    }
  });
}

export function subscribeProgress(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function defaultProgress(char: string): CharacterProgress {
  return {
    char,
    status: 'new',
    views: 0,
    spoken: 0,
    correctStreak: 0,
  };
}

async function readRaw(): Promise<ProgressMap> {
  if (memCache) return memCache;
  try {
    const raw = await AsyncStorage.getItem(KEY_PROGRESS);
    memCache = raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    memCache = {};
  }
  return memCache;
}

async function persist(map: ProgressMap): Promise<void> {
  memCache = map;
  try {
    await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(map));
  } catch {
    /* 忽略 */
  }
  notify();
}

// 缓存预热（loadCharacters 同步，方便首页早期渲染）
export async function preloadProgress(): Promise<void> {
  await readRaw();
}

export async function loadProgress(): Promise<ProgressMap> {
  return readRaw();
}

/** 同步读取，仅在 preloadProgress 之后调用才能拿到完整数据。 */
export function loadProgressSync(): ProgressMap {
  return memCache ?? {};
}

export async function getProgress(char: string): Promise<CharacterProgress> {
  const map = await readRaw();
  return map[char] || defaultProgress(char);
}

async function update(
  char: string,
  patch: (p: CharacterProgress) => CharacterProgress,
): Promise<CharacterProgress> {
  const map = { ...(await readRaw()) };
  const prev = map[char] || defaultProgress(char);
  const next = patch({ ...prev });
  map[char] = next;
  await persist(map);
  return next;
}

export async function markView(char: string): Promise<void> {
  await update(char, (p) => ({
    ...p,
    views: p.views + 1,
    lastSeenAt: Date.now(),
    status: p.status === 'new' ? 'learning' : p.status,
  }));
  await pushRecent(char);
}

export async function markSpoken(char: string): Promise<void> {
  await update(char, (p) => ({
    ...p,
    spoken: p.spoken + 1,
    lastSeenAt: Date.now(),
    status: p.status === 'new' ? 'learning' : p.status,
  }));
}

export async function markKnown(char: string): Promise<void> {
  await update(char, (p) => ({
    ...p,
    status: 'mastered',
    correctStreak: p.correctStreak + 1,
    lastSeenAt: Date.now(),
    markedKnownAt: Date.now(),
    nextDueAt: Date.now() + 3 * ONE_DAY,
  }));
}

export async function markForgot(char: string): Promise<void> {
  await update(char, (p) => ({
    ...p,
    status: 'forgot',
    correctStreak: 0,
    lastSeenAt: Date.now(),
    markedForgotAt: Date.now(),
    nextDueAt: Date.now() + ONE_DAY,
  }));
}

/**
 * 小测验结果应用：简化版 SM-2 间隔重复。
 *  - 全对（correct === total）：status 升为 mastered，连对 +1，下次到期 = now + 2^streak 天（封顶 14 天）
 *  - 部分对（correct > 0）       ：status 至少为 learning，连对清零，下次到期 = now + 1 天
 *  - 全错                       ：status 降为 forgot，连对清零，下次到期 = now + 1 天
 */
export async function applyQuizResult(char: string, correct: number, total: number): Promise<CharacterProgress> {
  return update(char, (p) => {
    const next: CharacterProgress = { ...p, lastSeenAt: Date.now() };
    if (total > 0 && correct === total) {
      next.correctStreak = (p.correctStreak ?? 0) + 1;
      next.status = 'mastered';
      const days = Math.min(2 ** next.correctStreak, 14);
      next.nextDueAt = Date.now() + days * ONE_DAY;
      next.markedKnownAt = Date.now();
    } else if (correct > 0) {
      next.correctStreak = 0;
      next.status = 'learning';
      next.nextDueAt = Date.now() + ONE_DAY;
    } else {
      next.correctStreak = 0;
      next.status = 'forgot';
      next.nextDueAt = Date.now() + ONE_DAY;
      next.markedForgotAt = Date.now();
    }
    return next;
  });
}

export async function applyFollowReadResult(char: string, stars: number): Promise<CharacterProgress> {
  const normalizedStars = Math.max(1, Math.min(5, Math.round(stars)));
  const now = Date.now();
  return update(char, (p) => {
    const history = [
      { at: now, stars: normalizedStars },
      ...(p.followReadHistory || []),
    ].slice(0, FOLLOW_READ_HISTORY_MAX);
    return {
      ...p,
      followReadAttempts: (p.followReadAttempts || 0) + 1,
      followReadStars: (p.followReadStars || 0) + normalizedStars,
      bestFollowReadStars: Math.max(p.bestFollowReadStars || 0, normalizedStars),
      lastFollowReadAt: now,
      followReadHistory: history,
      lastSeenAt: now,
      status: p.status === 'new' ? 'learning' : p.status,
    };
  });
}

// ============================================================
// 最近字队列
// ============================================================

async function readRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_RECENT_CHARS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function pushRecent(char: string): Promise<void> {
  const list = await readRecent();
  const next = [char, ...list.filter((c) => c !== char)].slice(0, RECENT_MAX);
  try {
    await AsyncStorage.setItem(KEY_RECENT_CHARS, JSON.stringify(next));
  } catch {
    /* 忽略 */
  }
  await saveLastChar(char);
  notify();
}

export async function getRecent(limit = 6): Promise<string[]> {
  const list = await readRecent();
  return list.slice(0, limit);
}

// ============================================================
// 最近一次接触字（替代 last_index）
// ============================================================

export async function saveLastChar(char: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_LAST_CHAR, char);
  } catch {
    /* 忽略 */
  }
}

export async function loadLastChar(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(KEY_LAST_CHAR)) || null;
  } catch {
    return null;
  }
}

// ============================================================
// 派生：统计 / 错字本 / 今日复习 / 待学
// ============================================================

export function computeStats(map: ProgressMap): ProgressStats {
  const all = loadCharacters();
  const stats: ProgressStats = {
    total: all.length,
    mastered: 0,
    learning: 0,
    forgot: 0,
    new: 0,
  };
  for (const c of all) {
    const status = (map[c.char]?.status ?? 'new') as LearningStatus;
    stats[status] += 1;
  }
  return stats;
}

export function getWrongList(map: ProgressMap): string[] {
  const all = loadCharacters();
  return all.filter((c) => map[c.char]?.status === 'forgot').map((c) => c.char);
}

/**
 * 今日复习列表：
 *  - 错字本中所有字（最优先）
 *  - "已掌握"但 nextDueAt 已到的字
 *  - 不超过 20 个
 */
export function getDueToday(map: ProgressMap, limit = 20): string[] {
  const now = Date.now();
  const all = loadCharacters();
  const wrong: string[] = [];
  const due: string[] = [];
  for (const c of all) {
    const p = map[c.char];
    if (!p) continue;
    if (p.status === 'forgot') {
      wrong.push(c.char);
    } else if (p.status === 'mastered' && p.nextDueAt && p.nextDueAt <= now) {
      due.push(c.char);
    }
  }
  return [...wrong, ...due].slice(0, limit);
}

/** 未学（new 状态）的字，按字表顺序返回前 N 个 */
export function getNewChars(map: ProgressMap, limit = 20): string[] {
  const all = loadCharacters();
  return all
    .filter((c) => !map[c.char] || map[c.char].status === 'new')
    .slice(0, limit)
    .map((c) => c.char);
}

export function getLearningChars(map: ProgressMap): string[] {
  const all = loadCharacters();
  return all.filter((c) => map[c.char]?.status === 'learning').map((c) => c.char);
}

/** 字表中所有字 + 状态（默认 new） */
export function getStatusMap(map: ProgressMap): Record<string, LearningStatus> {
  const out: Record<string, LearningStatus> = {};
  for (const c of loadCharacters()) {
    out[c.char] = map[c.char]?.status ?? 'new';
  }
  return out;
}

/** 状态对应展示色 */
export function statusColor(status: LearningStatus): string {
  switch (status) {
    case 'mastered':
      return '#10B981';
    case 'forgot':
      return '#EF4444';
    case 'learning':
      return '#F59E0B';
    default:
      return '#D1D5DB';
  }
}

export function statusLabel(status: LearningStatus): string {
  switch (status) {
    case 'mastered':
      return '已掌握';
    case 'forgot':
      return '还不会';
    case 'learning':
      return '在学';
    default:
      return '未学';
  }
}
