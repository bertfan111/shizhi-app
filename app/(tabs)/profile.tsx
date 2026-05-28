import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress } from '../../src/data/useProgress';
import { loadCharacters } from '../../src/data/loadCharacters';
import { buildAchievementSnapshot } from '../../src/data/achievementStore';
import { ToyButton } from '../../src/components/ToyButton';
import { FollowReadAssessment } from '../../src/components/FollowReadAssessment';
import { WeeklyReportCard } from '../../src/components/WeeklyReportCard';
import { RoleGrowthCard } from '../../src/components/RoleGrowthCard';
import { AchievementGrid } from '../../src/components/AchievementGrid';
import { COLORS, FONT_HANZI, FONT_PINYIN, RADIUS } from '../../src/theme';

const STORAGE_KEYS = [
  'shizi:progress:v1',
  'shizi:last_char:v1',
  'shizi:recent_chars:v1',
];

export default function ProfileScreen() {
  const { stats, map, dueToday, recent, newChars } = useProgress();
  const allChars = useMemo(() => loadCharacters(), []);
  const charMap = useMemo(() => new Map(allChars.map((item) => [item.char, item])), [allChars]);
  const achievementSnapshot = useMemo(() => buildAchievementSnapshot(map, stats), [map, stats]);

  // 本周：周一到周日，每天有多少字 lastSeenAt 落在那一天
  const weekStats = useMemo(() => {
    const days: { label: string; date: Date; count: number; isToday: boolean }[] = [];
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const mondayOffset = (todayMid.getDay() + 6) % 7;
    const weekStart = new Date(todayMid);
    weekStart.setDate(todayMid.getDate() - mondayOffset);
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        label: labels[i],
        date: d,
        count: 0,
        isToday: i === mondayOffset,
      });
    }
    const dayStart = days[0].date.getTime();
    const weekEnd = dayStart + 7 * 24 * 60 * 60 * 1000;
    for (const p of Object.values(map)) {
      if (!p.lastSeenAt || p.lastSeenAt < dayStart || p.lastSeenAt >= weekEnd) continue;
      const idx = Math.floor((p.lastSeenAt - dayStart) / (24 * 60 * 60 * 1000));
      if (idx >= 0 && idx < days.length) days[idx].count++;
    }
    const max = Math.max(1, ...days.map((d) => d.count));
    return { days, max };
  }, [map]);

  const followReadCandidates = useMemo(() => {
    const seen = new Set<string>();
    const picked = [...dueToday, ...recent, ...newChars.slice(0, 8)]
      .filter((char) => {
        if (seen.has(char)) return false;
        seen.add(char);
        return true;
      })
      .map((char) => charMap.get(char))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return picked.length > 0 ? picked : allChars.slice(0, 8);
  }, [allChars, charMap, dueToday, newChars, recent]);

  const handleReset = useCallback(() => {
    const doReset = async () => {
      try {
        await AsyncStorage.multiRemove(STORAGE_KEYS);
        if (Platform.OS === 'web') {
          // 网页提示后自动刷新
          window.location.reload();
        } else {
          Alert.alert('已重置', '所有学习记录已清空，重新打开 App 即可看到初始状态。');
        }
      } catch (e) {
        console.warn('清空进度失败', e);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('确定清空所有学习记录吗？此操作不可撤销。')) {
        doReset();
      }
    } else {
      Alert.alert('清空学习记录', '所有进度（已掌握/错字本/最近学过）都会清空，不可撤销。', [
        { text: '取消', style: 'cancel' },
        { text: '确定清空', style: 'destructive', onPress: doReset },
      ]);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>我的</Text>
        </View>

        <Text style={styles.sectionTitle}>角色养成</Text>
        <RoleGrowthCard snapshot={achievementSnapshot} />

        <Text style={styles.sectionTitle}>我的勋章</Text>
        <AchievementGrid achievements={achievementSnapshot.achievements} />

        <Text style={styles.sectionTitle}>本周学习</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTotal}>
              本周接触 {weekStats.days.reduce((s, d) => s + d.count, 0)} 字
            </Text>
          </View>
          <View style={styles.weekChartRow}>
            {weekStats.days.map((d, idx) => (
              <View key={idx} style={styles.weekColumn}>
                <View style={styles.weekBarTrack}>
                  <View
                    style={[
                      styles.weekBarFill,
                      {
                        height: `${(d.count / weekStats.max) * 100}%`,
                        backgroundColor: d.isToday ? COLORS.primary : '#FCD34D',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.weekLabel, d.isToday && styles.weekLabelToday]}>
                  {d.label}
                </Text>
                <Text style={styles.weekValue}>{d.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>跟读评测</Text>
        <FollowReadAssessment candidates={followReadCandidates} progressMap={map} />

        <Text style={styles.sectionTitle}>家长周报</Text>
        <WeeklyReportCard
          stats={stats}
          progressMap={map}
          weekDays={weekStats.days}
          dueTodayCount={dueToday.length}
        />

        <Text style={styles.sectionTitle}>设置</Text>
        <ToyButton
          onPress={handleReset}
          color={COLORS.card}
          shadowColor="#FECACA"
          thickness={4}
          radius={RADIUS.md}
          accessibilityRole="button"
          accessibilityLabel="清空学习记录"
        >
          <View style={styles.dangerCard}>
            <Ionicons name="trash" size={22} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>清空学习记录</Text>
              <Text style={styles.dangerDesc}>会清掉已掌握、错字本、最近学过</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </View>
        </ToyButton>

        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutLine}>识字小天地 · 一年级（统编版）</Text>
          <Text style={styles.aboutMeta}>共 {stats.total} 字，离线运行，不联网</Text>
          <Text style={styles.aboutMeta}>字体：霞鹜文楷 轻便版（SIL OFL）</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerRow: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  title: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  dangerTitle: {
    color: '#B91C1C',
    fontFamily: FONT_HANZI,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
  weekCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTotal: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '700',
  },
  weekChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 96,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  weekColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weekBarTrack: {
    width: 14,
    height: 64,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.borderSoft,
    borderRadius: 7,
    overflow: 'hidden',
  },
  weekBarFill: {
    width: '100%',
    minHeight: 4,
  },
  weekLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
  },
  weekLabelToday: {
    color: COLORS.primaryDeep,
    fontWeight: '700',
  },
  weekValue: {
    color: COLORS.text,
    fontFamily: FONT_PINYIN,
    fontSize: 11,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    gap: 8,
  },
  aboutLine: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '700',
  },
  aboutMeta: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
  },
});
