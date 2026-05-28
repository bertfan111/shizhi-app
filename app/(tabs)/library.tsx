import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadCharacters } from '../../src/data/loadCharacters';
import { useProgress } from '../../src/data/useProgress';
import {
  statusColor,
  statusLabel,
} from '../../src/data/learningStore';
import { BouncyPressable } from '../../src/components/BouncyPressable';
import { ToyButton } from '../../src/components/ToyButton';
import { FONT_HANZI, FONT_PINYIN, COLORS, RADIUS } from '../../src/theme';
import type { Character, LearningStatus } from '../../src/types';

type VolumeFilter = 'all' | 'upper' | 'lower';
type StatusFilter = 'all' | LearningStatus;

const VOLUME_LABELS: Record<VolumeFilter, string> = {
  all: '全部',
  upper: '上册',
  lower: '下册',
};

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'new', label: '未学' },
  { id: 'learning', label: '在学' },
  { id: 'forgot', label: '错字' },
  { id: 'mastered', label: '已掌握' },
];

function stripTone(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[üǖǘǚǜ]/gi, 'v');
}

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const all = useMemo(() => loadCharacters(), []);
  const { statusMap } = useProgress();
  const [volume, setVolume] = useState<VolumeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    let upper = 0;
    let lower = 0;
    for (const c of all) {
      if (c.volume === 'upper') upper++;
      else if (c.volume === 'lower') lower++;
    }
    return { all: all.length, upper, lower };
  }, [all]);

  const filtered = useMemo(() => {
    let result = all;
    const q = query.trim();
    if (q) {
      // 当有搜索词时，忽略上下册和状态的筛选，进行全库搜索
      const qStripped = stripTone(q);
      result = result.filter((c) => {
        if (c.char.includes(q)) return true;
        const py = c.pinyin || '';
        if (py.toLowerCase().startsWith(q.toLowerCase())) return true;
        if (stripTone(py).startsWith(qStripped)) return true;
        return false;
      });
    } else {
      if (volume !== 'all') {
        result = result.filter((c) => c.volume === volume);
      }
      if (statusFilter !== 'all') {
        result = result.filter((c) => (statusMap[c.char] || 'new') === statusFilter);
      }
    }
    return result;
  }, [all, volume, statusFilter, query, statusMap]);

  const columns = useMemo(() => {
    if (width >= 900) return 8;
    if (width >= 600) return 7;
    if (width >= 400) return 6;
    return 5;
  }, [width]);

  const cellSize = useMemo(() => {
    const horizontalPadding = 16 * 2;
    const totalGap = (columns - 1) * 8;
    return Math.floor((width - horizontalPadding - totalGap) / columns);
  }, [width, columns]);

  const onCellPress = useCallback(
    (char: string) => {
      router.push({ pathname: '/learn', params: { char } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Character }) => {
      const status = (statusMap[item.char] || 'new') as LearningStatus;
      return (
        <ToyButton
          onPress={() => onCellPress(item.char)}
          color={COLORS.card}
          shadowColor={COLORS.borderSoft}
          thickness={4}
          radius={16}
          style={{ width: cellSize, height: cellSize }}
          accessibilityRole="button"
          accessibilityLabel={`选择生字 ${item.char}，拼音 ${item.pinyin}，${statusLabel(status)}`}
        >
          <View style={styles.cellFace}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
            <Text style={[styles.cellPinyin, { fontSize: Math.max(10, cellSize * 0.18) }]}>
              {item.pinyin}
            </Text>
            <Text
              style={[styles.cellChar, { fontSize: Math.max(20, cellSize * 0.55) }]}
              allowFontScaling={false}
            >
              {item.char}
            </Text>
          </View>
        </ToyButton>
      );
    },
    [cellSize, onCellPress, statusMap],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <Text style={styles.title}>字库</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜索：汉字 或 拼音（如 tian / tiān）"
          placeholderTextColor={COLORS.textLight}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <BouncyPressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </BouncyPressable>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {(['upper', 'lower', 'all'] as VolumeFilter[]).map((v) => {
          const active = volume === v;
          return (
            <BouncyPressable
              key={v}
              scaleTo={0.95}
              onPress={() => setVolume(v)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {VOLUME_LABELS[v]}
              </Text>
            </BouncyPressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, maxHeight: 64 }}
        contentContainerStyle={styles.statusFilterRow}
      >
        {STATUS_FILTERS.map((s) => {
          const active = statusFilter === s.id;
          const color = s.id === 'all' ? COLORS.primaryDeep : statusColor(s.id);
          return (
            <BouncyPressable
              key={s.id}
              scaleTo={0.94}
              onPress={() => setStatusFilter(s.id)}
              style={[
                styles.statusChip,
                active && { backgroundColor: COLORS.primaryDeep },
              ]}
            >
              {s.id !== 'all' ? (
                <View
                  style={[
                    styles.statusChipDot,
                    { backgroundColor: active ? '#FFFFFF' : color },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.statusChipText,
                  active && { color: '#FFFFFF' },
                ]}
              >
                {s.label}
              </Text>
            </BouncyPressable>
          );
        })}
      </ScrollView>

      <Text style={styles.resultCount}>
        {filtered.length === 0 ? '没找到对应的字' : `共 ${filtered.length} 字`}
      </Text>

      <FlatList
        key={`grid-${columns}`}
        data={filtered}
        keyExtractor={(item) => item.char}
        numColumns={columns}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  spacer: {
    minWidth: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    letterSpacing: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONT_HANZI,
  },
  tabTextActive: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
  },
  statusFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  statusChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrap: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: COLORS.text,
    fontFamily: FONT_HANZI,
  },
  clearBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONT_HANZI,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  cellFace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  statusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cellPinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontWeight: '600',
    marginBottom: 2,
  },
  cellChar: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontWeight: '700',
    lineHeight: undefined,
    includeFontPadding: false,
  },
});
