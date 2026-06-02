import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_HANZI, FONT_PINYIN } from '../theme';
import type { AchievementProgress } from '../types';

interface Props {
  achievements: AchievementProgress[];
}

export const AchievementGrid: React.FC<Props> = ({ achievements }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>我的勋章</Text>
        <Text style={styles.subTitle}>
          已点亮 {achievements.filter((item) => item.unlocked).length} / {achievements.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {achievements.map((item) => {
          const percent = Math.min(100, Math.round((item.current / item.target) * 100));
          const color = item.unlocked ? COLORS.primary : COLORS.textLight;
          return (
            <View
              key={item.id}
              style={[
                styles.medal,
                item.unlocked ? styles.medalUnlocked : styles.medalLocked,
              ]}
            >
              <View style={[styles.iconBubble, { backgroundColor: item.unlocked ? '#FEF3C7' : COLORS.borderSoft }]}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={color}
                />
              </View>
              <Text style={[styles.medalTitle, !item.unlocked && styles.lockedText]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.medalDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percent}%`,
                      backgroundColor: item.unlocked ? COLORS.primary : COLORS.textLight,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.min(item.current, item.target)} / {item.target}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
  },
  subTitle: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  medal: {
    width: '48%',
    minHeight: 158,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  medalUnlocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  medalLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.borderSoft,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalTitle: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '800',
  },
  lockedText: {
    color: COLORS.textMuted,
  },
  medalDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
    lineHeight: 16,
    minHeight: 32,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.borderSoft,
    marginTop: 'auto',
  },
  progressFill: {
    height: '100%',
    minWidth: 4,
  },
  progressText: {
    color: COLORS.textMuted,
    fontFamily: FONT_PINYIN,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
});
