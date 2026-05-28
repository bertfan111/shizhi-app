import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_HANZI, FONT_PINYIN } from '../theme';
import { ToyRabbit } from './ToyRabbit';
import type { AchievementSnapshot } from '../types';

interface Props {
  snapshot: AchievementSnapshot;
}

export const RoleGrowthCard: React.FC<Props> = ({ snapshot }) => {
  const { role, unlockedCount, totalCount } = snapshot;
  const percent = Math.round(role.progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.roleBubble}>
        <ToyRabbit level={role.level} />
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>Lv.{role.level}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>{role.name}</Text>
            <Text style={styles.subTitle}>{role.title}</Text>
          </View>
          <View style={styles.badgePill}>
            <Ionicons name="ribbon" size={14} color={COLORS.primaryDeep} />
            <Text style={styles.badgeText}>{unlockedCount}/{totalCount}</Text>
          </View>
        </View>

        <View style={styles.energyHeader}>
          <Text style={styles.energyLabel}>成长能量</Text>
          <Text style={styles.energyValue}>{role.energy}</Text>
        </View>
        <View style={styles.energyTrack}>
          <View style={[styles.energyFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.hint}>{role.nextHint}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
  },
  roleBubble: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    borderWidth: 3,
    borderColor: '#FDBA74',
    position: 'relative',
  },
  roleChar: {
    display: 'none',
  },
  levelPill: {
    position: 'absolute',
    bottom: -10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#FFFFFF',
    fontFamily: FONT_PINYIN,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
  },
  subTitle: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 3,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_PINYIN,
    fontSize: 12,
    fontWeight: '800',
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  energyLabel: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
  },
  energyValue: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_PINYIN,
    fontSize: 13,
    fontWeight: '800',
  },
  energyTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.borderSoft,
  },
  energyFill: {
    height: '100%',
    minWidth: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  hint: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    lineHeight: 18,
  },
});
