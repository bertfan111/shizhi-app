/**
 * 学习进度 React Hook：订阅 learningStore 的更新。
 *
 * - 初次挂载会 await preloadProgress，之后直接读 memCache。
 * - 任意 markView/markKnown/markForgot 等写操作都会触发订阅刷新。
 */
import { useEffect, useState } from 'react';
import {
  computeStats,
  getDueToday,
  getNewChars,
  getRecent,
  getStatusMap,
  getWrongList,
  loadProgressSync,
  preloadProgress,
  subscribeProgress,
} from './learningStore';
import type {
  CharacterProgress,
  LearningStatus,
  ProgressStats,
} from '../types';

interface ProgressSnapshot {
  ready: boolean;
  map: Record<string, CharacterProgress>;
  statusMap: Record<string, LearningStatus>;
  stats: ProgressStats;
  wrongList: string[];
  dueToday: string[];
  newChars: string[];
  recent: string[];
}

function snapshot(): Omit<ProgressSnapshot, 'ready' | 'recent'> {
  const map = loadProgressSync();
  return {
    map,
    statusMap: getStatusMap(map),
    stats: computeStats(map),
    wrongList: getWrongList(map),
    dueToday: getDueToday(map),
    newChars: getNewChars(map),
  };
}

export function useProgress(): ProgressSnapshot {
  const [ready, setReady] = useState<boolean>(loadProgressSync() !== null);
  const [snap, setSnap] = useState(() => snapshot());
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    preloadProgress().then(async () => {
      if (!alive) return;
      setSnap(snapshot());
      setRecent(await getRecent());
      setReady(true);
    });
    const unsub = subscribeProgress(async () => {
      if (!alive) return;
      setSnap(snapshot());
      setRecent(await getRecent());
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return { ready, recent, ...snap };
}
