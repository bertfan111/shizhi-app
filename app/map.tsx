/**
 * 关卡地图：把字表按 5 字一关分组，每关展示掌握进度，点击进入对应学习页。
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCharacters } from '../src/data/loadCharacters';
import { useProgress } from '../src/data/useProgress';
import { statusColor } from '../src/data/learningStore';
import { BouncyPressable } from '../src/components/BouncyPressable';
import { GradientBackground } from '../src/components/GradientBackground';
import { ToyButton } from '../src/components/ToyButton';
import { COLORS, FONT_HANZI, FONT_PINYIN, RADIUS } from '../src/theme';
import { safeBack } from '../src/utils/nav';
import type { LearningStatus } from '../src/types';

const PER_LESSON = 5;

interface Lesson {
  index: number;
  from: number;
  to: number;
  chars: { char: string; pinyin: string; status: LearningStatus }[];
}

export default function MapScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const all = useMemo(() => loadCharacters(), []);
  const { statusMap } = useProgress();

  const lessons: Lesson[] = useMemo(() => {
    const out: Lesson[] = [];
    for (let i = 0; i < all.length; i += PER_LESSON) {
      const slice = all.slice(i, i + PER_LESSON);
      out.push({
        index: out.length + 1,
        from: i,
        to: i + slice.length,
        chars: slice.map((c) => ({
          char: c.char,
          pinyin: c.pinyin,
          status: (statusMap[c.char] || 'new') as LearningStatus,
        })),
      });
    }
    return out;
  }, [all, statusMap]);

  const columns = width >= 600 ? 3 : 2;
  const cardWidth = (width - 16 * 2 - 12 * (columns - 1)) / columns;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <BouncyPressable onPress={() => safeBack(router)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primaryDeep} />
          <Text style={styles.backText}>返回</Text>
        </BouncyPressable>
        <Text style={styles.title}>关卡地图</Text>
        <View style={styles.spacer} />
      </View>

      <Text style={styles.hint}>
        每关 {PER_LESSON} 个字，按教材课次顺序排列。共 {lessons.length} 关。
      </Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => `lesson-${item.index}`}
        numColumns={columns}
        key={`lessons-${columns}`}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            width={cardWidth}
            onPress={() =>
              router.push({
                pathname: '/learn',
                params: {
                  mode: 'lesson',
                  from: String(item.from),
                  to: String(item.to),
                  title: `第 ${item.index} 关`,
                },
              })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      </SafeAreaView>
    </GradientBackground>
  );
}

const LessonCard: React.FC<{
  lesson: Lesson;
  width: number;
  onPress: () => void;
}> = ({ lesson, width, onPress }) => {
  const mastered = lesson.chars.filter((c) => c.status === 'mastered').length;
  const total = lesson.chars.length;
  const ratio = total === 0 ? 0 : mastered / total;
  const cleared = mastered === total && total > 0;

  return (
    <ToyButton
      onPress={onPress}
      color={COLORS.card}
      shadowColor={COLORS.borderSoft}
      thickness={5}
      radius={RADIUS.md}
      style={{ width }}
      accessibilityRole="button"
      accessibilityLabel={`第 ${lesson.index} 关，已掌握 ${mastered} / ${total}`}
    >
      <View style={styles.cardFace}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIndex}>第 {lesson.index} 关</Text>
          {cleared ? (
            <Ionicons name="trophy" size={18} color="#F59E0B" />
          ) : (
            <Text style={styles.cardCount}>
              {mastered}/{total}
            </Text>
          )}
        </View>
        <View style={styles.charRow}>
          {lesson.chars.map((c) => (
            <View key={c.char} style={styles.charSlot}>
              <View
                style={[
                  styles.charStatusDot,
                  { backgroundColor: statusColor(c.status) },
                ]}
              />
              <Text style={styles.charText}>{c.char}</Text>
            </View>
          ))}
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${ratio * 100}%` }]} />
        </View>
      </View>
    </ToyButton>
  );
};

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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    letterSpacing: 2,
  },
  spacer: {
    minWidth: 80,
  },
  hint: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardFace: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIndex: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '800',
  },
  cardCount: {
    color: COLORS.textMuted,
    fontFamily: FONT_PINYIN,
    fontSize: 12,
    fontWeight: '700',
  },
  charRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  charSlot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  charStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 3,
    right: 3,
  },
  charText: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 17,
    fontWeight: '700',
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderSoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
