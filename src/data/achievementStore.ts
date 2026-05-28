import type {
  AchievementProgress,
  AchievementSnapshot,
  CharacterProgress,
  ProgressStats,
  RoleGrowth,
} from '../types';

const ONE_DAY = 24 * 60 * 60 * 1000;

interface AchievementRule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  target: number;
  current: (metrics: AchievementMetrics) => number;
}

interface AchievementMetrics {
  touchedCount: number;
  masteredCount: number;
  wrongCount: number;
  wrongRevisits: number; // 错字本中已翻盘的字数（标错后又标会）
  followAttempts: number;
  fiveStarCount: number;
  streakDays: number;
}

/**
 * 等级表：每个等级对应一种角色装饰（在 ToyRabbit 中按 level 渲染）。
 * 能量门槛设计为温和增长，新手 30 → 90 → 220 → 500，长期玩家也能持续解锁。
 */
const ROLE_LEVELS = [
  { level: 1, energy: 0,   title: '刚出发的小伙伴' },
  { level: 2, energy: 30,  title: '系着蝴蝶结的小兔' },
  { level: 3, energy: 80,  title: '戴花环的小兔' },
  { level: 4, energy: 160, title: '听故事的小兔' },
  { level: 5, energy: 280, title: '围围巾的小学者' },
  { level: 6, energy: 450, title: '博学小眼镜兔' },
  { level: 7, energy: 650, title: '戴皇冠的识字大王' },
  { level: 8, energy: 900, title: '识字小博士' },
];

const ACHIEVEMENT_RULES: AchievementRule[] = [
  // —— 入门 / 探索 (4) ——
  {
    id: 'first_step',
    title: '初次出发',
    description: '第一次接触任意生字',
    icon: 'rocket',
    color: '#3B82F6',
    target: 1,
    current: (m) => m.touchedCount,
  },
  {
    id: 'touch_20',
    title: '小有眼缘',
    description: '接触过 20 个生字',
    icon: 'eye',
    color: '#0EA5E9',
    target: 20,
    current: (m) => m.touchedCount,
  },
  {
    id: 'touch_100',
    title: '识字小达人',
    description: '接触过 100 个生字',
    icon: 'library',
    color: '#6366F1',
    target: 100,
    current: (m) => m.touchedCount,
  },
  {
    id: 'touch_300',
    title: '字海探险家',
    description: '接触过 300 个生字',
    icon: 'compass',
    color: '#7C3AED',
    target: 300,
    current: (m) => m.touchedCount,
  },

  // —— 掌握 (4) ——
  {
    id: 'master_10',
    title: '识字 10 个',
    description: '累计掌握 10 个生字',
    icon: 'ribbon',
    color: '#8B5CF6',
    target: 10,
    current: (m) => m.masteredCount,
  },
  {
    id: 'master_50',
    title: '识字 50 个',
    description: '累计掌握 50 个生字',
    icon: 'trophy',
    color: '#F43F5E',
    target: 50,
    current: (m) => m.masteredCount,
  },
  {
    id: 'master_100',
    title: '识字百强',
    description: '累计掌握 100 个生字',
    icon: 'medal',
    color: '#D946EF',
    target: 100,
    current: (m) => m.masteredCount,
  },
  {
    id: 'master_300',
    title: '识字三百勇',
    description: '累计掌握 300 个生字',
    icon: 'school',
    color: '#A21CAF',
    target: 300,
    current: (m) => m.masteredCount,
  },

  // —— 复习 / 错字 (2) ——
  {
    id: 'wrong_warrior',
    title: '错字小勇士',
    description: '主动整理或复习错字',
    icon: 'shield-checkmark',
    color: '#EF4444',
    target: 1,
    current: (m) => m.wrongCount,
  },
  {
    id: 'wrong_revisit_10',
    title: '反败为胜',
    description: '把 10 个错字本里的字标为已会',
    icon: 'refresh-circle',
    color: '#DC2626',
    target: 10,
    current: (m) => m.wrongRevisits,
  },

  // —— 跟读 / 朗读 (3) ——
  {
    id: 'follow_5',
    title: '跟读小明星',
    description: '完成 5 次跟读评测',
    icon: 'mic',
    color: '#06B6D4',
    target: 5,
    current: (m) => m.followAttempts,
  },
  {
    id: 'follow_30',
    title: '朗读小行家',
    description: '完成 30 次跟读评测',
    icon: 'musical-notes',
    color: '#0891B2',
    target: 30,
    current: (m) => m.followAttempts,
  },
  {
    id: 'five_star_10',
    title: '五星发音员',
    description: '累计获得 10 次 5 星跟读',
    icon: 'star',
    color: '#F59E0B',
    target: 10,
    current: (m) => m.fiveStarCount,
  },

  // —— 坚持 (3) ——
  {
    id: 'streak_3',
    title: '坚持 3 天',
    description: '连续 3 天有学习记录',
    icon: 'flame',
    color: '#F59E0B',
    target: 3,
    current: (m) => m.streakDays,
  },
  {
    id: 'streak_7',
    title: '一周小勇士',
    description: '连续 7 天有学习记录',
    icon: 'calendar',
    color: '#10B981',
    target: 7,
    current: (m) => m.streakDays,
  },
  {
    id: 'streak_14',
    title: '坚持半月',
    description: '连续 14 天有学习记录',
    icon: 'sparkles',
    color: '#059669',
    target: 14,
    current: (m) => m.streakDays,
  },
];

function dayKey(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function collectActiveDays(progressList: CharacterProgress[]): Set<number> {
  const days = new Set<number>();
  for (const p of progressList) {
    if (p.lastSeenAt) days.add(dayKey(p.lastSeenAt));
    if (p.markedKnownAt) days.add(dayKey(p.markedKnownAt));
    if (p.markedForgotAt) days.add(dayKey(p.markedForgotAt));
    for (const record of p.followReadHistory || []) {
      days.add(dayKey(record.at));
    }
  }
  return days;
}

function countCurrentStreak(activeDays: Set<number>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (activeDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildMetrics(map: Record<string, CharacterProgress>, stats: ProgressStats): AchievementMetrics {
  const progressList = Object.values(map);
  const activeDays = collectActiveDays(progressList);
  const followAttempts = progressList.reduce((sum, p) => sum + (p.followReadAttempts || 0), 0);
  const fiveStarCount = progressList.reduce(
    (sum, p) => sum + (p.followReadHistory || []).filter((r) => r.stars >= 5).length,
    0,
  );
  // 错字本"翻盘"：曾经标为还不会、之后又标为我会（markedKnownAt 比 markedForgotAt 新）
  const wrongRevisits = progressList.filter(
    (p) =>
      typeof p.markedForgotAt === 'number' &&
      typeof p.markedKnownAt === 'number' &&
      p.markedKnownAt > p.markedForgotAt,
  ).length;

  return {
    touchedCount: progressList.filter((p) => Boolean(p.lastSeenAt || p.views || p.spoken)).length,
    masteredCount: stats.mastered,
    wrongCount: progressList.filter((p) => p.status === 'forgot' || Boolean(p.markedForgotAt)).length,
    wrongRevisits,
    followAttempts,
    fiveStarCount,
    streakDays: countCurrentStreak(activeDays),
  };
}

function buildRole(metrics: AchievementMetrics, map: Record<string, CharacterProgress>): RoleGrowth {
  const progressList = Object.values(map);
  const viewEnergy = progressList.reduce((sum, p) => sum + (p.views || 0), 0);
  const spokenEnergy = progressList.reduce((sum, p) => sum + (p.spoken || 0), 0);
  const energy =
    metrics.touchedCount * 2 +
    metrics.masteredCount * 5 +
    viewEnergy +
    spokenEnergy +
    metrics.followAttempts * 3 +
    metrics.fiveStarCount * 2;

  let current = ROLE_LEVELS[0];
  let next = ROLE_LEVELS[ROLE_LEVELS.length - 1];
  for (let i = 0; i < ROLE_LEVELS.length; i++) {
    if (energy >= ROLE_LEVELS[i].energy) {
      current = ROLE_LEVELS[i];
      next = ROLE_LEVELS[Math.min(i + 1, ROLE_LEVELS.length - 1)];
    }
  }

  const range = Math.max(1, next.energy - current.energy);
  const progress = current.level === next.level ? 1 : Math.min(1, (energy - current.energy) / range);
  const nextHint =
    current.level === next.level
      ? '已经满级啦，继续收集更多勋章。'
      : `还差 ${Math.max(0, next.energy - energy)} 能量升到 Lv.${next.level}`;

  return {
    name: '识字小兔',
    level: current.level,
    title: current.title,
    energy,
    currentLevelEnergy: current.energy,
    nextLevelEnergy: next.energy,
    progress,
    nextHint,
  };
}

export function buildAchievementSnapshot(
  map: Record<string, CharacterProgress>,
  stats: ProgressStats,
): AchievementSnapshot {
  const metrics = buildMetrics(map, stats);
  const achievements: AchievementProgress[] = ACHIEVEMENT_RULES.map((rule) => {
    const current = rule.current(metrics);
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      icon: rule.icon,
      color: rule.color,
      current,
      target: rule.target,
      unlocked: current >= rule.target,
    };
  });
  return {
    role: buildRole(metrics, map),
    achievements,
    unlockedCount: achievements.filter((item) => item.unlocked).length,
    totalCount: achievements.length,
  };
}
