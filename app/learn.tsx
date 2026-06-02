import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCharacters } from '../src/data/loadCharacters';
import {
  getDueToday,
  getNewChars,
  getWrongList,
  loadLastChar,
  loadProgress,
  markForgot,
  markKnown,
  saveLastChar,
} from '../src/data/learningStore';
import { useProgress } from '../src/data/useProgress';
import { CharacterCard } from '../src/components/CharacterCard';
import { BouncyPressable } from '../src/components/BouncyPressable';
import { GradientBackground } from '../src/components/GradientBackground';
import { ToyButton } from '../src/components/ToyButton';
import { COLORS, FONT_HANZI, RADIUS } from '../src/theme';
import type { Character } from '../src/types';

const PER_LESSON = 5;

export type LearnMode =
  | 'continue'     // 从上次接触的字开始（默认）
  | 'review'       // 今日复习：错字本 + nextDueAt 到期
  | 'wrong'        // 错字本
  | 'random'       // 随机抽认
  | 'new'          // 待学
  | 'upper'        // 上册全部
  | 'lower'        // 下册全部
  | 'lesson';      // 单关（配合 from/to 参数）

const MODE_TITLES: Record<LearnMode, string> = {
  continue: '继续学习',
  review: '今日复习',
  wrong: '错字本',
  random: '随机抽认',
  new: '待学新字',
  upper: '一年级上册',
  lower: '一年级下册',
  lesson: '关卡',
};

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function LearnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: LearnMode;
    char?: string;
    goto?: string;
    from?: string;
    to?: string;
    title?: string;
  }>();
  const allChars = useMemo(() => loadCharacters(), []);
  const listRef = useRef<FlatList<Character>>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Character[] | null>(null);
  const [initialIndex, setInitialIndex] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const { statusMap } = useProgress();

  // 目标字优先：?char 或旧 ?goto
  const targetChar = (params.char as string) || (params.goto as string) || undefined;
  const mode: LearnMode = (params.mode as LearnMode) || 'continue';

  // 关卡模式专用：根据 params 计算「下一关」信息
  const nextLesson = useMemo(() => {
    if (mode !== 'lesson') return null;
    const from = Math.max(0, parseInt(params.from || '0', 10) || 0);
    const to = Math.min(
      allChars.length,
      parseInt(params.to || `${from + PER_LESSON}`, 10) || from + PER_LESSON,
    );
    const nextFrom = to;
    if (nextFrom >= allChars.length) return null;
    const nextTo = Math.min(nextFrom + PER_LESSON, allChars.length);
    const nextIndex = Math.floor(nextFrom / PER_LESSON) + 1;
    const currentIndex = Math.floor(from / PER_LESSON) + 1;
    return { from: nextFrom, to: nextTo, index: nextIndex, currentIndex };
  }, [mode, params.from, params.to, allChars.length]);

  const currentLessonIndex = useMemo(() => {
    if (mode !== 'lesson') return null;
    const from = Math.max(0, parseInt(params.from || '0', 10) || 0);
    return Math.floor(from / PER_LESSON) + 1;
  }, [mode, params.from]);

  useEffect(() => {
    let alive = true;
    // 每次重新加载列表前，先关掉可能残留的庆祝弹窗
    setShowCelebration(false);
    (async () => {
      const map = await loadProgress();
      let subset: Character[] = allChars;
      switch (mode) {
        case 'wrong': {
          const set = new Set(getWrongList(map));
          subset = allChars.filter((c) => set.has(c.char));
          break;
        }
        case 'review': {
          const set = new Set(getDueToday(map, 9999));
          subset = allChars.filter((c) => set.has(c.char));
          break;
        }
        case 'new': {
          const set = new Set(getNewChars(map, 9999));
          subset = allChars.filter((c) => set.has(c.char));
          break;
        }
        case 'random': {
          subset = shuffle(allChars).slice(0, 20);
          break;
        }
        case 'upper':
          subset = allChars.filter((c) => c.volume === 'upper');
          break;
        case 'lower':
          subset = allChars.filter((c) => c.volume === 'lower');
          break;
        case 'lesson': {
          const from = Math.max(0, parseInt(params.from || '0', 10) || 0);
          const to = Math.min(
            allChars.length,
            parseInt(params.to || `${from + 5}`, 10) || from + 5,
          );
          subset = allChars.slice(from, to);
          break;
        }
        case 'continue':
        default:
          subset = allChars;
          break;
      }

      if (subset.length === 0) {
        if (alive) {
          setList([]);
          setInitialIndex(0);
        }
        return;
      }

      // 决定 initialIndex
      let idx = 0;
      const anchor =
        targetChar || (mode === 'continue' ? await loadLastChar() : null);
      if (anchor) {
        const found = subset.findIndex((c) => c.char === anchor);
        if (found >= 0) idx = found;
      }
      if (alive) {
        setList(subset);
        setInitialIndex(idx);
        setCurrentIndex(idx);
        // 异步滚动到位
        setTimeout(() => {
          if (alive) {
            listRef.current?.scrollToIndex({ index: idx, animated: false });
          }
        }, 50);
      }
    })();
    return () => {
      alive = false;
    };
  }, [allChars, mode, targetChar, params.from, params.to]);

  const onCharPress = useCallback(
    (char: string) => {
      router.push({ pathname: '/story/[char]', params: { char } });
    },
    [router],
  );

  // 「我会了」：标为已掌握。
  // - 不是最后一张：自动滑到下一张
  // - 是最后一张：弹出庆祝弹窗（关卡模式 → 含「下一关」入口；其它模式 → 含「返回」）
  const onMarkKnown = useCallback(
    (char: string) => {
      markKnown(char).catch(() => {});
      if (!list) return;
      const idx = list.findIndex((c) => c.char === char);
      if (idx < 0) return;
      const nextIdx = idx + 1;
      if (nextIdx < list.length) {
        listRef.current?.scrollToIndex({ index: nextIdx, animated: true });
        setCurrentIndex(nextIdx);
        saveLastChar(list[nextIdx].char).catch(() => {});
      } else {
        setShowCelebration(true);
      }
    },
    [list],
  );

  // 「还不会」：加入错字本，并跳到故事页查看故事加深记忆
  const onMarkForgot = useCallback(
    (char: string) => {
      markForgot(char).catch(() => {});
      router.push({ pathname: '/story/[char]', params: { char } });
    },
    [router],
  );

  // 庆祝弹窗：跳转下一关
  const onGoToNextLesson = useCallback(() => {
    if (!nextLesson) return;
    setShowCelebration(false);
    router.replace({
      pathname: '/learn',
      params: {
        mode: 'lesson',
        from: String(nextLesson.from),
        to: String(nextLesson.to),
        title: `第 ${nextLesson.index} 关`,
      },
    });
  }, [nextLesson, router]);

  // 庆祝弹窗：返回（关卡模式回地图、其它模式回上一页）
  const onCelebrationBack = useCallback(() => {
    setShowCelebration(false);
    router.replace('/');
  }, [router]);

  // 庆祝弹窗：留下继续看（仅"我会了"已是最后一张但用户想留在原地）
  const onCelebrationStay = useCallback(() => {
    setShowCelebration(false);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!list) return;
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      if (idx >= 0 && idx < list.length) {
        setCurrentIndex(idx);
        saveLastChar(list[idx].char).catch(() => {});
      }
    },
    [list, width],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Character> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BouncyPressable
          onPress={() => router.replace('/')}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primaryDeep} />
          <Text style={styles.backText}>返回</Text>
        </BouncyPressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{(params.title as string) || MODE_TITLES[mode]}</Text>
          {list && list.length > 0 ? (
            <Text style={styles.subTitle}>共 {list.length} 字</Text>
          ) : null}
        </View>
        <View style={styles.spacer} />
      </View>

      {list === null ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cafe" size={48} color={COLORS.borderSoft} />
          <Text style={styles.emptyTitle}>
            {mode === 'wrong'
              ? '错字本还是空的'
              : mode === 'review'
                ? '今天没有要复习的字'
                : mode === 'new'
                  ? '已经全部学完啦'
                  : '没有可学的字'}
          </Text>
          <Text style={styles.emptyDesc}>去字库或随机抽认开始学习吧～</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={list}
          keyExtractor={(item) => item.char}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          windowSize={3}
          maxToRenderPerBatch={3}
          initialNumToRender={1}
          removeClippedSubviews
          style={styles.list}
          renderItem={({ item, index }) => (
            <CharacterCard
              data={item}
              index={index}
              total={list.length}
              onPress={onCharPress}
            />
          )}
        />
      )}

      {list && list.length > 0 ? (() => {
        const safeIdx = Math.max(0, Math.min(currentIndex, list.length - 1));
        const currentChar = list[safeIdx].char;
        const currentStatus = statusMap[currentChar] || 'new';
        const isForgot = currentStatus === 'forgot';
        const isMastered = currentStatus === 'mastered';
        return (
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <ToyButton
              onPress={() => onMarkForgot(currentChar)}
              color={isForgot ? COLORS.toyPink.base : COLORS.card}
              shadowColor={isForgot ? COLORS.toyPink.shadow : COLORS.toyPink.light}
              thickness={6}
              radius={RADIUS.md}
              style={styles.bottomBtn}
              accessibilityRole="button"
              accessibilityLabel="还不会，加入错字本并查看故事"
            >
              <View style={styles.bottomBtnFace}>
                <Ionicons
                  name="sad"
                  size={22}
                  color={isForgot ? '#FFF' : COLORS.toyPink.base}
                />
                <Text
                  style={[
                    styles.bottomBtnText,
                    { color: isForgot ? '#FFF' : COLORS.toyPink.base },
                  ]}
                >
                  还不会
                </Text>
              </View>
            </ToyButton>

            <ToyButton
              onPress={() => onMarkKnown(currentChar)}
              color={isMastered ? COLORS.toyGreen.base : COLORS.card}
              shadowColor={isMastered ? COLORS.toyGreen.shadow : COLORS.toyGreen.light}
              thickness={6}
              radius={RADIUS.md}
              style={styles.bottomBtn}
              accessibilityRole="button"
              accessibilityLabel="我会了，标为已掌握"
            >
              <View style={styles.bottomBtnFace}>
                <Ionicons
                  name="happy"
                  size={22}
                  color={isMastered ? '#FFF' : COLORS.toyGreen.base}
                />
                <Text
                  style={[
                    styles.bottomBtnText,
                    { color: isMastered ? '#FFF' : COLORS.toyGreen.base },
                  ]}
                >
                  我会了
                </Text>
              </View>
            </ToyButton>
          </View>
        );
      })() : null}

      {showCelebration ? (
        <View style={styles.celebrationOverlay} pointerEvents="auto">
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              {mode === 'lesson' ? '恭喜通关！' : '太棒了！'}
            </Text>
            <Text style={styles.celebrationDesc}>
              {mode === 'lesson' && currentLessonIndex !== null
                ? `你已学完第 ${currentLessonIndex} 关的全部 ${list?.length ?? PER_LESSON} 个字`
                : `你已学完这一组的全部 ${list?.length ?? 0} 个字`}
            </Text>

            {mode === 'lesson' && nextLesson ? (
              <View style={styles.celebrationActions}>
                <ToyButton
                  onPress={onCelebrationBack}
                  color={COLORS.card}
                  shadowColor={COLORS.borderSoft}
                  thickness={5}
                  radius={RADIUS.md}
                  style={{ flex: 1 }}
                  accessibilityRole="button"
                  accessibilityLabel="返回地图"
                >
                  <View style={styles.celebrationBtnFace}>
                    <Ionicons name="map" size={20} color={COLORS.primaryDeep} />
                    <Text style={[styles.celebrationBtnText, { color: COLORS.primaryDeep }]}>
                      返回地图
                    </Text>
                  </View>
                </ToyButton>
                <ToyButton
                  onPress={onGoToNextLesson}
                  color={COLORS.toyGreen.base}
                  shadowColor={COLORS.toyGreen.shadow}
                  thickness={5}
                  radius={RADIUS.md}
                  style={{ flex: 1 }}
                  accessibilityRole="button"
                  accessibilityLabel={`进入第 ${nextLesson.index} 关`}
                >
                  <View style={styles.celebrationBtnFace}>
                    <Text style={[styles.celebrationBtnText, { color: '#FFF' }]}>
                      下一关
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </View>
                </ToyButton>
              </View>
            ) : (
              <View style={styles.celebrationActions}>
                <ToyButton
                  onPress={onCelebrationStay}
                  color={COLORS.card}
                  shadowColor={COLORS.borderSoft}
                  thickness={5}
                  radius={RADIUS.md}
                  style={{ flex: 1 }}
                  accessibilityRole="button"
                  accessibilityLabel="留下继续看"
                >
                  <View style={styles.celebrationBtnFace}>
                    <Text style={[styles.celebrationBtnText, { color: COLORS.primaryDeep }]}>
                      留下看看
                    </Text>
                  </View>
                </ToyButton>
                <ToyButton
                  onPress={onCelebrationBack}
                  color={COLORS.toyGreen.base}
                  shadowColor={COLORS.toyGreen.shadow}
                  thickness={5}
                  radius={RADIUS.md}
                  style={{ flex: 1 }}
                  accessibilityRole="button"
                  accessibilityLabel="返回上一页"
                >
                  <View style={styles.celebrationBtnFace}>
                    <Text style={[styles.celebrationBtnText, { color: '#FFF' }]}>
                      太棒了！
                    </Text>
                  </View>
                </ToyButton>
              </View>
            )}
          </View>
        </View>
      ) : null}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  backText: {
    color: COLORS.primaryDeep,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_HANZI,
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    letterSpacing: 1,
  },
  subTitle: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    minWidth: 80,
  },
  list: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONT_HANZI,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.borderSoft,
    backgroundColor: COLORS.bg,
  },
  bottomBtn: {
    flex: 1,
  },
  bottomBtnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  bottomBtnText: {
    fontFamily: FONT_HANZI,
    fontSize: 17,
    fontWeight: '800',
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 41, 55, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    letterSpacing: 2,
  },
  celebrationDesc: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  celebrationActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  celebrationBtnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  celebrationBtnText: {
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
  },
});
