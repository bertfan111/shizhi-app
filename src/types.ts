/**
 * 全局数据类型定义
 */

// 每个汉字 + 它的拼音（标点的 pinyin 为 null）
export type PinyinChar = {
  char: string;
  pinyin: string | null;
};

// 故事：原文 + 逐字注音
export interface Story {
  text: string;
  annotated: PinyinChar[];
}

// 单个生字的完整数据
export interface Character {
  char: string;        // 例 "天"
  pinyin: string;      // 例 "tiān"
  volume: 'upper' | 'lower' | 'unknown'; // 所属册
  story: Story;
  image: string;       // 文件名，例如 "天.png"
}

// 数据集顶层结构（characters.json）
export interface Dataset {
  version: string;     // 数据版本号，便于增量更新判断
  generatedAt: string; // ISO 时间戳
  characters: Character[];
}

// ============================================================
// 学习状态相关
// ============================================================

// 单个字的掌握状态
//  - new       未学过（默认）
//  - learning  接触过但还不熟（点过故事、点过朗读、或测验偶有错）
//  - mastered  已掌握（用户标记我会了，或连续答对到达阈值）
//  - forgot    错字本（用户标记还不会，或测验全错）
export type LearningStatus = 'new' | 'learning' | 'mastered' | 'forgot';

// 字的学习进度
export interface CharacterProgress {
  char: string;
  status: LearningStatus;
  views: number;              // 进入故事页次数
  spoken: number;             // 朗读次数
  correctStreak: number;      // 小测验连对次数（阶段二）
  followReadAttempts?: number; // 跟读评测次数
  followReadStars?: number;    // 跟读累计星星数
  bestFollowReadStars?: number;// 跟读最高星级（1-5）
  lastFollowReadAt?: number;   // 最近一次跟读评测时间
  followReadHistory?: FollowReadRecord[]; // 最近跟读记录，用于周报
  lastSeenAt?: number;        // 上次接触时间戳（ms）
  nextDueAt?: number;         // 下次到期复习时间戳（ms，阶段二）
  markedKnownAt?: number;     // 最近一次标记为"我会了"
  markedForgotAt?: number;    // 最近一次标记为"还不会"
}

export interface FollowReadRecord {
  at: number;
  stars: number;
}

// 状态统计：用于首页仪表盘的数字
export interface ProgressStats {
  total: number;
  mastered: number;
  learning: number;
  forgot: number;
  new: number;
}

export interface AchievementProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  current: number;
  target: number;
  unlocked: boolean;
}

export interface RoleGrowth {
  name: string;
  level: number;
  title: string;
  energy: number;
  currentLevelEnergy: number;
  nextLevelEnergy: number;
  progress: number;
  nextHint: string;
}

export interface AchievementSnapshot {
  role: RoleGrowth;
  achievements: AchievementProgress[];
  unlockedCount: number;
  totalCount: number;
}
