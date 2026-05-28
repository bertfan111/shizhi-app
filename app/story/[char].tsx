import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { findCharacter } from '../../src/data/loadCharacters';
import {
  applyQuizResult,
  markForgot,
  markKnown,
  markSpoken,
  markView,
  statusColor,
  statusLabel,
} from '../../src/data/learningStore';
import { QuizModal } from '../../src/components/QuizModal';
import { useProgress } from '../../src/data/useProgress';
import { PinyinText } from '../../src/components/PinyinText';
import { StoryImage } from '../../src/components/StoryImage';
import { SpeakButton } from '../../src/components/SpeakButton';
import { BouncyPressable } from '../../src/components/BouncyPressable';
import { ToyButton } from '../../src/components/ToyButton';
import { BUILT_IN_VOICE_PROFILES, SpeechControls } from '../../src/components/SpeechControls';
import { useSpeech } from '../../src/hooks/useSpeech';
import { annotateText } from '../../src/data/annotateText';
import { FONT_HANZI, FONT_PINYIN, COLORS, RADIUS } from '../../src/theme';
import { safeBack } from '../../src/utils/nav';

export default function StoryScreen() {
  const { char } = useLocalSearchParams<{ char: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVoiceId, setSpeechVoiceId] = useState(BUILT_IN_VOICE_PROFILES[0].id);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const data = useMemo(() => (char ? findCharacter(char) : undefined), [char]);

  // 学习状态：用于显示当前 chip 与控制按钮高亮
  const { statusMap } = useProgress();
  const learningStatus = char ? statusMap[char] || 'new' : 'new';

  // 进入故事页时：自动标记 view + 记录 last char
  useEffect(() => {
    if (char && data) {
      markView(char).catch(() => {});
    }
  }, [char, data]);

  // 朗读 hook：只朗读故事正文
  const speakText = useMemo(() => {
    if (!data) return '';
    const { pinyin, story } = data;
    return story?.text ? story.text : pinyin;
  }, [data]);
  const speechProfile = useMemo(
    () => BUILT_IN_VOICE_PROFILES.find((p) => p.id === speechVoiceId) || BUILT_IN_VOICE_PROFILES[0],
    [speechVoiceId],
  );
  const { isSpeaking, toggle } = useSpeech(speakText, {
    rate: speechRate,
    pitch: speechProfile.pitch,
  });

  const handleSpeakToggle = () => {
    if (!isSpeaking && char) {
      markSpoken(char).catch(() => {});
    }
    toggle();
  };

  if (!char || !data) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.notFoundTitle}>找不到这个字</Text>
        <BouncyPressable style={styles.backBtn} onPress={() => safeBack(router)}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primaryDeep} />
          <Text style={styles.backBtnText}>返回</Text>
        </BouncyPressable>
      </View>
    );
  }

  const imageWidth = Math.min(width - 40, 300);
  const imageHeight = imageWidth;
  const hasStory = Boolean(data.story?.text);
  const storyAnnotated = useMemo(
    () => (data.story?.text ? annotateText(data.story.text) : data.story?.annotated || []),
    [data.story?.annotated, data.story?.text],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部工具栏 */}
      <View style={styles.topBar}>
        <BouncyPressable
          onPress={() => safeBack(router)}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primaryDeep} />
          <Text style={styles.backBtnText}>返回</Text>
        </BouncyPressable>

        <View style={styles.titleWrap}>
          <Text style={styles.titlePinyin}>{data.pinyin}</Text>
          <Text style={styles.titleChar}>{data.char}</Text>
        </View>

        <View style={styles.statusChipWrap}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(learningStatus) }]} />
          <Text style={styles.statusChipText}>{statusLabel(learningStatus)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 112 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 插图 */}
        <View style={styles.imageWrap}>
          <View style={styles.imageShadow}>
            <StoryImage char={data.char} width={imageWidth} height={imageHeight} />
          </View>
        </View>

        {/* 故事 */}
        <View style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <View style={styles.storyLabelWrap}>
              <Ionicons name="book" size={18} color={COLORS.secondary} />
              <Text style={styles.storyLabel}>识字小故事</Text>
            </View>
            <SpeakButton
              isSpeaking={isSpeaking}
              onPress={handleSpeakToggle}
              size={38}
            />
          </View>

          {hasStory ? (
            <View style={styles.textContent}>
              <PinyinText
                annotated={storyAnnotated}
                charSize={28}
                pinyinSize={14}
                targetChar={data.char}
              />
            </View>
          ) : (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyTitle}>这个字还没生成故事</Text>
              <Text style={styles.emptyDesc}>
                在开发机上跑一次 npm run build:dataset 就能补齐 ~100 字小故事和插图。
                {'\n'}（朗读按钮可以先朗读这个字。）
              </Text>
            </View>
          )}

          {/* 小测验入口 */}
          <ToyButton
            onPress={() => setQuizOpen(true)}
            color={COLORS.secondary}
            shadowColor="#2563EB"
            thickness={6}
            radius={RADIUS.xl}
            style={{ marginTop: 24 }}
            accessibilityRole="button"
            accessibilityLabel="开始小测验"
          >
            <View style={styles.quizBtnFace}>
              <Ionicons name="game-controller" size={26} color="#FFFFFF" />
              <Text style={styles.quizBtnText}>开始小测验</Text>
            </View>
          </ToyButton>

          {/* 学习状态按钮 */}
          <View style={styles.actionRow}>
            <ToyButton
              onPress={() => {
                markForgot(data.char);
                safeBack(router);
              }}
              color={learningStatus === 'forgot' ? '#F43F5E' : '#FFFFFF'}
              shadowColor={learningStatus === 'forgot' ? '#BE123C' : '#FECACA'}
              thickness={6}
              radius={RADIUS.lg}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel="还不会，加入错字本"
            >
              <View style={styles.actionBtnFace}>
                <Ionicons name="sad" size={24} color={learningStatus === 'forgot' ? '#FFF' : '#F43F5E'} />
                <Text style={[styles.actionBtnText, { color: learningStatus === 'forgot' ? '#FFF' : '#F43F5E' }]}>还不会</Text>
              </View>
            </ToyButton>
            <ToyButton
              onPress={() => {
                markKnown(data.char);
                safeBack(router);
              }}
              color={learningStatus === 'mastered' ? '#10B981' : '#FFFFFF'}
              shadowColor={learningStatus === 'mastered' ? '#047857' : '#A7F3D0'}
              thickness={6}
              radius={RADIUS.lg}
              style={{ flex: 1 }}
              accessibilityRole="button"
              accessibilityLabel="我会了，标为已掌握"
            >
              <View style={styles.actionBtnFace}>
                <Ionicons name="happy" size={24} color={learningStatus === 'mastered' ? '#FFF' : '#10B981'} />
                <Text style={[styles.actionBtnText, { color: learningStatus === 'mastered' ? '#FFF' : '#10B981' }]}>我会了</Text>
              </View>
            </ToyButton>
          </View>
        </View>
      </ScrollView>

      <QuizModal
        visible={quizOpen}
        target={data}
        onClose={() => setQuizOpen(false)}
        onFinish={(c, t) => {
          applyQuizResult(data.char, c, t).catch(() => {});
        }}
      />

      <View
        pointerEvents="box-none"
        style={[styles.floatLayer, { bottom: insets.bottom + 18 }]}
      >
        {controlsOpen ? (
          <View style={styles.floatPanel}>
            <SpeechControls
              rate={speechRate}
              selectedVoiceId={speechVoiceId}
              onRateChange={setSpeechRate}
              onVoiceChange={(profile) => setSpeechVoiceId(profile.id)}
            />
          </View>
        ) : null}
        <BouncyPressable
          onPress={() => setControlsOpen((v) => !v)}
          style={styles.floatBtn}
          accessibilityRole="button"
          accessibilityLabel="朗读设置"
        >
          <Ionicons
            name={controlsOpen ? 'close' : 'options'}
            size={24}
            color="#FFFFFF"
          />
        </BouncyPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderSoft,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backBtnText: {
    color: COLORS.primaryDeep,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_HANZI,
    marginLeft: 2,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.borderSoft,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 12,
  },
  titlePinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontSize: 14,
    fontWeight: '600',
  },
  titleChar: {
    color: COLORS.accent,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: FONT_HANZI,
  },
  spacer: {
    minWidth: 80,
  },
  statusChipWrap: {
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusChipText: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '600',
  },
  quizBtnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  quizBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  actionBtnFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionBtnText: {
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  imageWrap: {
    marginBottom: 12,
  },
  imageShadow: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  storyCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: '#F0F9FF',
    paddingVertical: 12,
    borderRadius: 20,
  },
  storyLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  storyLabel: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONT_HANZI,
    letterSpacing: 2,
  },
  textContent: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  floatLayer: {
    position: 'absolute',
    right: 18,
    alignItems: 'flex-end',
    gap: 10,
  },
  floatBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floatPanel: {
    width: 300,
    maxWidth: '92%',
    padding: 14,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  emptyHint: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontFamily: FONT_HANZI,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONT_HANZI,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    gap: 20,
  },
  notFoundTitle: {
    fontSize: 24,
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontWeight: '700',
  },
});
