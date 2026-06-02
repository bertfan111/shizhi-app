import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  useWindowDimensions,
  ScrollView,
  Pressable,
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
import { GradientBackground } from '../../src/components/GradientBackground';
import { FONT_HANZI, FONT_PINYIN, COLORS } from '../../src/theme';
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
  const [volume, setVolume] = useState<VolumeFilter>('upper');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let result = all;
    if (volume !== 'all') {
      result = result.filter((c) => c.volume === volume);
    }
    if (statusFilter !== 'all') {
      result = result.filter((c) => (statusMap[c.char] || 'new') === statusFilter);
    }
    const q = query.trim();
    if (q) {
      const qStripped = stripTone(q);
      result = result.filter((c) => {
        if (c.char.includes(q)) return true;
        const py = c.pinyin || '';
        if (py.toLowerCase().startsWith(q.toLowerCase())) return true;
        if (stripTone(py).startsWith(qStripped)) return true;
        return false;
      });
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
    return Math.max(56, Math.floor((width - horizontalPadding - totalGap) / columns));
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
      const pinyinSize = Math.max(10, cellSize * 0.18);
      const charSize = Math.max(20, cellSize * 0.55);
      return (
        <Pressable
          onPress={() => onCellPress(item.char)}
          style={[styles.cellCard, { width: cellSize, height: cellSize }]}
          accessibilityRole="button"
          accessibilityLabel={`选择生字 ${item.char}，拼音 ${item.pinyin}，${statusLabel(status)}`}
        >
          <View style={styles.cellFace}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
            <Text
              style={[
                styles.cellPinyin,
                { fontSize: pinyinSize, lineHeight: pinyinSize + 4 },
              ]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {item.pinyin}
            </Text>
            <Text
              style={[
                styles.cellChar,
                { fontSize: charSize, lineHeight: charSize + 6 },
              ]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {item.char}
            </Text>
          </View>
        </Pressable>
      );
    },
    [cellSize, onCellPress, statusMap],
  );

  return (
    <GradientBackground>
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
          <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {(['upper', 'lower', 'all'] as VolumeFilter[]).map((v) => {
          const active = volume === v;
          return (
            <Pressable
              key={v}
              onPress={() => setVolume(v)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {VOLUME_LABELS[v]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilterScroll}
        contentContainerStyle={styles.statusFilterRow}
      >
        {STATUS_FILTERS.map((s) => {
          const active = statusFilter === s.id;
          const color = s.id === 'all' ? COLORS.primaryDeep : statusColor(s.id);
          return (
            <Pressable
              key={s.id}
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
            </Pressable>
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
    marginHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
    marginTop: 6,
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    height: 44,
    paddingVertical: 9,
    marginHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_HANZI,
  },
  tabTextActive: {
    color: COLORS.primaryDeep,
  },
  statusFilterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 58,
  },
  statusFilterRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
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
    minHeight: 34,
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
    lineHeight: 18,
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
    paddingBottom: 96,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cellCard: {
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFace: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 6,
    paddingBottom: 6,
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
    includeFontPadding: true,
  },
  cellChar: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontWeight: '700',
    includeFontPadding: true,
  },
});
