import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from '../../src/data/useProgress';
import { statusColor, statusLabel } from '../../src/data/learningStore';
import { findCharacter } from '../../src/data/loadCharacters';
import { GradientBackground } from '../../src/components/GradientBackground';
import { ToyButton } from '../../src/components/ToyButton';
import { ProgressRing } from '../../src/components/ProgressRing';
import { COLORS, FONT_HANZI, FONT_PINYIN, RADIUS } from '../../src/theme';
import type { LearningStatus } from '../../src/types';

interface QuickEntry {
  id: 'continue' | 'review' | 'wrong' | 'random';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: { base: string; shadow: string; text: string; icon: string };
  badge?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ goto?: string }>();
  const { ready, stats, wrongList, dueToday, recent, statusMap, map } = useProgress();
  const { width } = useWindowDimensions();

  // 今日已学：lastSeenAt 在今天的字
  const todayLearned = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const ts = start.getTime();
    let count = 0;
    for (const p of Object.values(map)) {
      if (p.lastSeenAt && p.lastSeenAt >= ts) count++;
    }
    return count;
  }, [map]);
  const todayGoal = 5;

  // 兼容老链接：/?goto=字 自动跳到 learn 页
  useEffect(() => {
    if (params.goto) {
      router.replace({ pathname: '/learn', params: { char: params.goto } });
    }
  }, [params.goto, router]);

  const entries: QuickEntry[] = useMemo(
    () => [
      {
        id: 'continue',
        label: '继续学习',
        icon: 'play',
        theme: { base: COLORS.toyBlue.light, shadow: '#BFDBFE', text: COLORS.toyBlue.shadow, icon: COLORS.toyBlue.base },
      },
      {
        id: 'review',
        label: '今日复习',
        icon: 'refresh',
        theme: { base: COLORS.toyOrange.light, shadow: '#FDE68A', text: COLORS.toyOrange.shadow, icon: COLORS.toyOrange.base },
        badge: dueToday.length,
      },
      {
        id: 'wrong',
        label: '错字本',
        icon: 'close',
        theme: { base: COLORS.toyPink.light, shadow: '#FECACA', text: COLORS.toyPink.shadow, icon: COLORS.toyPink.base },
        badge: wrongList.length,
      },
      {
        id: 'random',
        label: '随机抽认',
        icon: 'shuffle',
        theme: { base: COLORS.toyGreen.light, shadow: '#A7F3D0', text: COLORS.toyGreen.shadow, icon: COLORS.toyGreen.base },
      },
    ],
    [dueToday.length, wrongList.length],
  );

  const onEntryPress = (id: QuickEntry['id']) => {
    router.push({ pathname: '/learn', params: { mode: id } });
  };

  const cardWidth = (width - 16 * 2 - 12) / 2;

  if (!ready) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primaryDeep} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greet}>你好，小朋友</Text>
            <Text style={styles.title}>识字小天地</Text>
          </View>
          <ToyButton
            onPress={() => router.push('/map')}
            color={COLORS.toyOrange.light}
            shadowColor="#FDE68A"
            thickness={4}
            radius={999}
            accessibilityRole="button"
            accessibilityLabel="关卡地图"
          >
            <View style={styles.libBtn}>
              <Ionicons name="map" size={18} color={COLORS.primaryDeep} />
              <Text style={styles.libBtnText}>关卡</Text>
            </View>
          </ToyButton>
        </View>

        <View style={styles.dashCard}>
          <ProgressRing current={stats.mastered} total={stats.total} size={132} />
          <View style={styles.chipsCol}>
            <StatChip color={statusColor('mastered')} label="已掌握" value={stats.mastered} />
            <StatChip color={statusColor('learning')} label="在学" value={stats.learning} />
            <StatChip color={statusColor('forgot')} label="还不会" value={stats.forgot} />
            <StatChip color={statusColor('new')} label="未学" value={stats.new} />
          </View>
        </View>

        {/* 今日任务 */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View style={styles.todayHeaderLeft}>
              <Ionicons name="sunny" size={20} color={COLORS.primary} />
              <Text style={styles.todayTitle}>今日任务</Text>
            </View>
            <Text style={styles.todayCount}>
              {Math.min(todayLearned, todayGoal)} / {todayGoal}
            </Text>
          </View>
          <View style={styles.todayBar}>
            <View
              style={[
                styles.todayBarFill,
                { width: `${Math.min(1, todayLearned / todayGoal) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.todayDesc}>
            {todayLearned >= todayGoal
              ? '今日目标完成啦，再多学几个也行～'
              : `今天还需要 ${todayGoal - todayLearned} 个字`}
          </Text>
        </View>

        <View style={styles.entryGrid}>
          {entries.map((e) => (
            <ToyButton
              key={e.id}
              onPress={() => onEntryPress(e.id)}
              color={e.theme.base}
              shadowColor={e.theme.shadow}
              thickness={6}
              radius={RADIUS.md}
              style={{ width: cardWidth }}
            >
              <View style={styles.entryFace}>
                <View style={styles.entryHeader}>
                  <View style={[styles.entryIconBg, { backgroundColor: e.theme.shadow }]}>
                    <Ionicons name={e.icon} size={28} color={e.theme.base} />
                  </View>
                  {typeof e.badge === 'number' && e.badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{e.badge > 99 ? '99+' : e.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.entryLabel, { color: e.theme.text }]}>{e.label}</Text>
              </View>
            </ToyButton>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近学过</Text>
          {recent.length > 0 ? (
            <Text style={styles.sectionMore}>共 {recent.length} 个</Text>
          ) : null}
        </View>
        {recent.length === 0 ? (
          <View style={styles.recentEmpty}>
            <Ionicons name="leaf-outline" size={28} color={COLORS.borderSoft} />
            <Text style={styles.recentEmptyText}>
              还没有学习记录，点上面"继续学习"开始吧
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRow}
          >
            {recent.map((ch) => {
              const c = findCharacter(ch);
              if (!c) return null;
              const status = (statusMap[ch] || 'new') as LearningStatus;
              return (
                <RecentCell key={ch} char={ch} pinyin={c.pinyin} status={status} />
              );
            })}
          </ScrollView>
        )}

        <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const StatChip: React.FC<{ color: string; label: string; value: number }> = ({
  color,
  label,
  value,
}) => (
  <View style={statChipStyles.row}>
    <View style={[statChipStyles.dot, { backgroundColor: color }]} />
    <Text style={statChipStyles.label}>{label}</Text>
    <Text style={statChipStyles.value}>{value}</Text>
  </View>
);

const statChipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    flex: 1,
  },
  value: {
    color: COLORS.text,
    fontFamily: FONT_PINYIN,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

const RecentCell: React.FC<{
  char: string;
  pinyin: string;
  status: LearningStatus;
}> = ({ char, pinyin, status }) => {
  const router = useRouter();
  return (
    <ToyButton
      onPress={() => router.push({ pathname: '/story/[char]', params: { char } })}
      color={COLORS.card}
      shadowColor={COLORS.borderSoft}
      thickness={4}
      radius={20}
      style={{ marginRight: 12 }}
      accessibilityRole="button"
      accessibilityLabel={`${char}，${statusLabel(status)}`}
    >
      <View style={recentStyles.cellFace}>
        <Text style={recentStyles.pinyin} numberOfLines={1}>
          {pinyin}
        </Text>
        <Text style={recentStyles.char}>{char}</Text>
        <View style={[recentStyles.dot, { backgroundColor: statusColor(status) }]} />
      </View>
    </ToyButton>
  );
};

const recentStyles = StyleSheet.create({
  cellFace: {
    width: 76,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  pinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontWeight: '600',
    fontSize: 12,
  },
  char: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  greet: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 14,
  },
  title: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  libBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.borderSoft,
    borderRadius: 999,
  },
  libBtnText: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '700',
  },
  dashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  chipsCol: {
    flex: 1,
    gap: 4,
  },
  todayCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
    gap: 8,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayTitle: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 15,
    fontWeight: '800',
  },
  todayCount: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_PINYIN,
    fontSize: 14,
    fontWeight: '800',
  },
  todayBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDE68A',
    overflow: 'hidden',
  },
  todayBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  todayDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
  },
  entryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  entry: {
    // 基础宽高由行内传入
  },
  entryFace: {
    flex: 1,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: FONT_PINYIN,
    fontSize: 12,
    fontWeight: '700',
  },
  entryLabel: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  entryDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionMore: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
  },
  recentEmpty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  recentEmptyText: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    textAlign: 'center',
  },
  recentRow: {
    paddingRight: 16,
  },
});
