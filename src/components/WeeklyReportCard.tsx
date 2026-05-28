import React, { useMemo } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToyButton } from './ToyButton';
import { COLORS, FONT_HANZI, FONT_PINYIN, RADIUS } from '../theme';
import type { CharacterProgress, ProgressStats } from '../types';

export interface WeekDayStat {
  label: string;
  count: number;
  isToday: boolean;
}

interface Props {
  stats: ProgressStats;
  progressMap: Record<string, CharacterProgress>;
  weekDays: WeekDayStat[];
  dueTodayCount: number;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getCurrentWeekStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - mondayOffset);
  return start;
}

function countSince(
  map: Record<string, CharacterProgress>,
  since: number,
  field: 'lastSeenAt' | 'markedKnownAt' | 'markedForgotAt',
): number {
  return Object.values(map).filter((p) => {
    const value = p[field];
    return typeof value === 'number' && value >= since;
  }).length;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  let line = '';
  let currentY = y;
  for (const char of Array.from(text)) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export const WeeklyReportCard: React.FC<Props> = ({
  stats,
  progressMap,
  weekDays,
  dueTodayCount,
}) => {
  const report = useMemo(() => {
    const start = getCurrentWeekStart();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const since = start.getTime();

    const progressList = Object.values(progressMap);
    const followRecords = progressList.flatMap((p) =>
      (p.followReadHistory || []).filter((r) => r.at >= since),
    );
    const assessedChars = progressList.filter((p) => (p.lastFollowReadAt || 0) >= since).length;
    const followStars = followRecords.reduce((sum, r) => sum + r.stars, 0);
    const averageStars = followRecords.length > 0 ? followStars / followRecords.length : 0;
    const touched = countSince(progressMap, since, 'lastSeenAt');
    const mastered = countSince(progressMap, since, 'markedKnownAt');
    const forgot = countSince(progressMap, since, 'markedForgotAt');
    const weekTouchTotal = weekDays.reduce((sum, d) => sum + d.count, 0);
    const bestFollow = progressList
      .filter((p) => p.bestFollowReadStars)
      .sort((a, b) => (b.bestFollowReadStars || 0) - (a.bestFollowReadStars || 0))
      .slice(0, 3);

    const suggestion =
      stats.forgot > 0
        ? `优先复习 ${stats.forgot} 个错字，再学新字。`
        : followRecords.length > 0 && averageStars < 4
          ? '本周跟读很积极，下周重点把发音星级提到 4 星以上。'
          : dueTodayCount > 0
            ? `今天有 ${dueTodayCount} 个字到期，适合做 5 分钟复习。`
            : '保持每天 5 分钟识字和跟读，节奏很好。';

    return {
      since,
      until: end.getTime(),
      touched,
      mastered,
      forgot,
      weekTouchTotal,
      followCount: followRecords.length,
      assessedChars,
      averageStars,
      bestFollow,
      suggestion,
    };
  }, [dueTodayCount, progressMap, stats.forgot, weekDays]);

  const reportText = [
    `识字小天地家长周报（${formatDate(report.since)}-${formatDate(report.until)}）`,
    `本周接触：${report.touched} 字`,
    `本周掌握：${report.mastered} 字`,
    `跟读评测：${report.followCount} 次，平均 ${report.averageStars ? report.averageStars.toFixed(1) : '--'} 星`,
    `当前进度：已掌握 ${stats.mastered} / ${stats.total} 字，错字 ${stats.forgot} 个`,
    `建议：${report.suggestion}`,
  ].join('\n');

  const saveReportImage = () => {
    const canvas = document.createElement('canvas');
    const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = 900;
    const height = 1280;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      Alert.alert('保存失败', '当前浏览器无法生成图片。');
      return;
    }
    ctx.scale(scale, scale);
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#B45309';
    ctx.font = '700 42px sans-serif';
    ctx.fillText('识字小天地 · 家长周报', 48, 78);
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px sans-serif';
    ctx.fillText(`${formatDate(report.since)} - ${formatDate(report.until)}`, 48, 116);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(48, 150, 804, 300, 28);
    ctx.fill();
    ctx.stroke();

    const metrics = [
      ['接触生字', `${report.touched}`, '字'],
      ['新掌握', `${report.mastered}`, '字'],
      ['跟读评测', `${report.followCount}`, '次'],
      ['平均星级', report.averageStars ? report.averageStars.toFixed(1) : '--', '星'],
    ];
    metrics.forEach(([label, value, suffix], idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 82 + col * 380;
      const y = 212 + row * 118;
      ctx.fillStyle = '#6B7280';
      ctx.font = '22px sans-serif';
      ctx.fillText(label, x, y);
      ctx.fillStyle = '#1F2937';
      ctx.font = '700 48px sans-serif';
      ctx.fillText(value, x, y + 58);
      ctx.fillStyle = '#6B7280';
      ctx.font = '22px sans-serif';
      ctx.fillText(suffix, x + ctx.measureText(value).width + 12, y + 58);
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#F3F4F6';
    ctx.beginPath();
    ctx.roundRect(48, 490, 804, 250, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1F2937';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('本周学习趋势', 82, 548);
    const max = Math.max(1, ...weekDays.map((item) => item.count));
    weekDays.forEach((day, idx) => {
      const x = 100 + idx * 105;
      const barHeight = Math.max(10, (day.count / max) * 110);
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(x, 588, 28, 120);
      ctx.fillStyle = day.isToday ? '#F59E0B' : '#BFDBFE';
      ctx.fillRect(x, 708 - barHeight, 28, barHeight);
      ctx.fillStyle = day.isToday ? '#B45309' : '#6B7280';
      ctx.font = '20px sans-serif';
      ctx.fillText(day.label, x + 2, 736);
      ctx.fillStyle = '#1F2937';
      ctx.font = '700 20px sans-serif';
      ctx.fillText(String(day.count), x + 6, 570);
    });

    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.roundRect(48, 780, 804, 150, 24);
    ctx.fill();
    ctx.fillStyle = '#B45309';
    ctx.font = '700 26px sans-serif';
    ctx.fillText('本周建议', 82, 830);
    ctx.font = '22px sans-serif';
    drawWrappedText(ctx, report.suggestion, 82, 870, 720, 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#F3F4F6';
    ctx.beginPath();
    ctx.roundRect(48, 970, 804, 190, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1F2937';
    ctx.font = '700 26px sans-serif';
    ctx.fillText('当前总进度', 82, 1024);
    ctx.font = '24px sans-serif';
    ctx.fillText(`已掌握 ${stats.mastered} / ${stats.total} 字`, 82, 1070);
    ctx.fillText(`错字本 ${stats.forgot} 个 · 今日待复习 ${dueTodayCount} 个`, 82, 1110);
    ctx.fillStyle = '#6B7280';
    ctx.font = '20px sans-serif';
    ctx.fillText('图片由识字小天地自动生成，可保存后发给家长。', 82, 1148);

    const link = document.createElement('a');
    link.download = `识字小天地-家长周报-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExport = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      saveReportImage();
      return;
    }
    Alert.alert('家长周报', `${reportText}\n\n当前原生端暂未接入相册写入权限，可以先截图保存。`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>家长周报</Text>
          <Text style={styles.desc}>
            {formatDate(report.since)} - {formatDate(report.until)} · 自动汇总本机学习记录
          </Text>
        </View>
        <ToyButton
          onPress={handleExport}
          color={COLORS.primary}
          shadowColor={COLORS.primaryDeep}
          thickness={4}
          radius={RADIUS.sm}
          accessibilityRole="button"
          accessibilityLabel="保存家长周报图片"
        >
          <View style={styles.exportFace}>
            <Ionicons name="image" size={16} color="#FFFFFF" />
            <Text style={styles.exportText}>保存图片</Text>
          </View>
        </ToyButton>
      </View>

      <View style={styles.metricGrid}>
        <Metric icon="calendar" label="接触生字" value={`${report.touched}`} suffix="字" />
        <Metric icon="ribbon" label="新掌握" value={`${report.mastered}`} suffix="字" />
        <Metric icon="mic" label="跟读评测" value={`${report.followCount}`} suffix="次" />
        <Metric
          icon="star"
          label="平均星级"
          value={report.averageStars ? report.averageStars.toFixed(1) : '--'}
          suffix="星"
        />
      </View>

      <View style={styles.chartRow}>
        {weekDays.map((d, idx) => {
          const max = Math.max(1, ...weekDays.map((item) => item.count));
          return (
            <View key={`${d.label}-${idx}`} style={styles.dayColumn}>
              <View style={styles.dayTrack}>
                <View
                  style={[
                    styles.dayFill,
                    {
                      height: `${(d.count / max) * 100}%`,
                      backgroundColor: d.isToday ? COLORS.primary : '#BFDBFE',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.summaryBox}>
        <Ionicons name="bulb" size={18} color={COLORS.primaryDeep} />
        <Text style={styles.summaryText}>{report.suggestion}</Text>
      </View>

      {report.bestFollow.length > 0 ? (
        <View style={styles.bestRow}>
          <Text style={styles.bestTitle}>本周发音亮点</Text>
          <View style={styles.bestChips}>
            {report.bestFollow.map((p) => (
              <View key={p.char} style={styles.bestChip}>
                <Text style={styles.bestChar}>{p.char}</Text>
                <Text style={styles.bestStar}>{p.bestFollowReadStars} 星</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyHint}>完成一次跟读评测后，这里会出现发音亮点。</Text>
      )}
    </View>
  );
};

const Metric: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  suffix: string;
}> = ({ icon, label, value, suffix }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={18} color={COLORS.secondary} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>
      {value}
      <Text style={styles.metricSuffix}> {suffix}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
  },
  desc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 4,
  },
  exportFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportText: {
    color: '#FFFFFF',
    fontFamily: FONT_HANZI,
    fontSize: 12,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: '47%',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    gap: 4,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
  },
  metricValue: {
    color: COLORS.text,
    fontFamily: FONT_PINYIN,
    fontSize: 20,
    fontWeight: '800',
  },
  metricSuffix: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
    fontWeight: '600',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 82,
    paddingHorizontal: 2,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayTrack: {
    width: 14,
    height: 56,
    justifyContent: 'flex-end',
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: COLORS.borderSoft,
  },
  dayFill: {
    width: '100%',
    minHeight: 4,
  },
  dayLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
  },
  dayLabelToday: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
  },
  summaryText: {
    flex: 1,
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  bestRow: {
    gap: 8,
  },
  bestTitle: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '800',
  },
  bestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  bestChar: {
    color: COLORS.accent,
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
  },
  bestStar: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyHint: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    lineHeight: 18,
  },
});
