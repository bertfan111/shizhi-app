import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { ToyButton } from './ToyButton';
import { applyFollowReadResult } from '../data/learningStore';
import { COLORS, FONT_HANZI, FONT_PINYIN, RADIUS } from '../theme';
import type { Character, CharacterProgress } from '../types';

interface Props {
  candidates: Character[];
  progressMap: Record<string, CharacterProgress>;
}

const RECORDING_SECONDS = 5;

function canRecordAudio(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  );
}

function starLabel(stars: number): string {
  if (stars >= 5) return '非常标准';
  if (stars >= 4) return '读得很棒';
  if (stars >= 3) return '继续加油';
  return '再听一遍';
}

export const FollowReadAssessment: React.FC<Props> = ({ candidates, progressMap }) => {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [feedback, setFeedback] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingUrlRef = useRef('');

  // 过滤掉已经获得 5 颗星的字（最高星级 >= 5 视为掌握，不再推荐）
  const eligibleCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const p = progressMap[c.char];
      return !p || (p.bestFollowReadStars || 0) < 5;
    });
  }, [candidates, progressMap]);

  // 用候选字内容作为"洗牌触发签名"——只在字列表内容真正变化时重排，
  // 避免 progressMap 每次更新都触发重新洗牌（否则用户每次操作顺序都会乱跳）。
  const eligibleKey = useMemo(
    () => eligibleCandidates.map((c) => c.char).join('|'),
    [eligibleCandidates],
  );

  // 洗牌后的字序列：每次候选内容变化都重排一次，按这个顺序依次出现
  const [shuffled, setShuffled] = useState<Character[]>([]);

  useEffect(() => {
    const arr = eligibleCandidates.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
    setIndex(0);
    // 候选刷新时清掉上一字遗留的录音和反馈
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = '';
    }
    setFeedback('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleKey]);

  const target = shuffled.length > 0 ? shuffled[index % shuffled.length] : null;
  const progress = target ? progressMap[target.char] : undefined;
  const attempts = progress?.followReadAttempts || 0;
  const averageStars = attempts > 0 ? ((progress?.followReadStars || 0) / attempts).toFixed(1) : '--';
  const bestStars = progress?.bestFollowReadStars || 0;

  const canUseRecording = useMemo(() => canRecordAudio(), []);

  const clearRecordingTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearRecordingTimers();
      stopStream();
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
      }
    };
  }, []);

  const speakSample = async () => {
    if (!target) return;
    try {
      await Speech.stop();
    } catch {
      /* ignore */
    }
    Speech.speak(target.char, {
      language: 'zh-CN',
      rate: 0.75,
      pitch: 1.05,
    });
  };

  const saveStars = async (stars: number) => {
    if (!target || stars <= 0) return;
    const char = target.char;
    await applyFollowReadResult(char, stars);
    if (stars >= 5) {
      // 5 星即视为已掌握，下次刷新时这个字会从候选中自动剔除；
      // 这里立即推进到下一字，避免显示已"出师"的字。
      setFeedback(`🎉「${char}」已 5 星出师！下一个字～`);
      if (shuffled.length > 1) {
        setIndex((v) => (v + 1) % shuffled.length);
      }
      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = '';
      }
    } else {
      setFeedback(`已给「${char}」记录 ${stars} 星：${starLabel(stars)}`);
    }
  };

  const startFollowRead = async () => {
    if (!target) return;
    if (recording) return;
    if (!canUseRecording) {
      Alert.alert('当前平台暂不支持录音回放', '可以先听标准音，再由家长点击星星完成跟读评测。');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current);
        recordingUrlRef.current = '';
      }
      setRecording(true);
      setCountdown(RECORDING_SECONDS);
      setFeedback(`请孩子读「${target.char}」，${RECORDING_SECONDS} 秒后会自动回放。`);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        clearRecordingTimers();
        stopStream();
        setRecording(false);
        setCountdown(0);

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) {
          setFeedback('没有录到声音，请检查麦克风后再试一次，或手动给星。');
          return;
        }

        const url = URL.createObjectURL(blob);
        recordingUrlRef.current = url;
        setFeedback('跟读录音已完成，正在自动回放。听完后请家长点星星。');
        const audio = new Audio(url);
        audio.play().catch(() => {
          setFeedback('跟读录音已完成，但浏览器阻止了自动回放。请家长根据孩子刚才的发音直接点星星。');
        });
      };

      recorder.start();
      intervalRef.current = setInterval(() => {
        setCountdown((value) => Math.max(0, value - 1));
      }, 1000);
      timeoutRef.current = setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, RECORDING_SECONDS * 1000);
    } catch {
      clearRecordingTimers();
      stopStream();
      setRecording(false);
      setCountdown(0);
      setFeedback('麦克风不可用或权限被拒绝，请允许麦克风权限，或直接手动给星。');
    }
  };

  const stopFollowRead = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const nextTarget = () => {
    if (shuffled.length <= 1) return;
    setIndex((v) => (v + 1) % shuffled.length);
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current);
      recordingUrlRef.current = '';
    }
    setFeedback('');
  };

  if (!target) {
    const allCleared = candidates.length > 0 && eligibleCandidates.length === 0;
    return (
      <View style={styles.card}>
        <Text style={styles.title}>跟读评测</Text>
        <Text style={styles.emptyText}>
          {allCleared
            ? '太棒了！这些字都已经 5 星出师，去学习更多生字解锁新的跟读吧。'
            : '还没有可评测的字，先去学习几个生字吧。'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>跟读评测</Text>
          <Text style={styles.desc}>
            听标准音后录 5 秒跟读，自动回放后由家长给星。
          </Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="mic" size={16} color={COLORS.primaryDeep} />
          <Text style={styles.badgeText}>{canUseRecording ? '录音回放' : '手动评'}</Text>
        </View>
      </View>

      <View style={styles.targetRow}>
        <View style={styles.charBubble}>
          <Text style={styles.pinyin}>{target.pinyin}</Text>
          <Text style={styles.char}>{target.char}</Text>
        </View>
        <View style={styles.targetMeta}>
          <Text style={styles.metaLine}>评测 {attempts} 次 · 平均 {averageStars} 星</Text>
          <View style={styles.bestRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < bestStars ? 'star' : 'star-outline'}
                size={18}
                color={i < bestStars ? COLORS.primary : COLORS.textLight}
              />
            ))}
          </View>
          <Text style={styles.metaHint}>最高星级会进入家长周报。</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <ToyButton
          onPress={speakSample}
          color={COLORS.primary}
          shadowColor={COLORS.primaryDeep}
          thickness={5}
          radius={RADIUS.md}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="听标准音"
        >
          <View style={styles.primaryFace}>
            <Ionicons name="volume-high" size={20} color="#FFFFFF" />
            <Text style={styles.primaryText}>听标准音</Text>
          </View>
        </ToyButton>
        <ToyButton
          onPress={recording ? stopFollowRead : startFollowRead}
          color={COLORS.secondary}
          shadowColor="#1D4ED8"
          thickness={5}
          radius={RADIUS.md}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={recording ? '结束跟读录音' : '开始跟读录音'}
        >
          <View style={styles.primaryFace}>
            <Ionicons name={recording ? 'radio' : 'mic'} size={20} color="#FFFFFF" />
            <Text style={styles.primaryText}>
              {recording ? `${countdown || 1} 秒` : '开始跟读'}
            </Text>
          </View>
        </ToyButton>
      </View>

      <Text style={styles.starPrompt}>听完录音后请点星星：</Text>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, i) => {
          const stars = i + 1;
          return (
            <ToyButton
              key={stars}
              onPress={() => saveStars(stars)}
              color="#FFF7ED"
              shadowColor="#FDBA74"
              thickness={4}
              radius={RADIUS.sm}
              style={styles.starButton}
              accessibilityRole="button"
              accessibilityLabel={`记录 ${stars} 星`}
            >
              <View style={styles.starFace}>
                <Ionicons name="star" size={22} color={COLORS.primary} />
                <Text style={styles.starText}>{stars}</Text>
              </View>
            </ToyButton>
          );
        })}
      </View>

      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <View style={styles.footerRow}>
        <Text style={styles.footerHint}>优先练今日复习、最近学习和待学新字。</Text>
        <ToyButton
          onPress={nextTarget}
          color={COLORS.card}
          shadowColor={COLORS.border}
          thickness={3}
          radius={RADIUS.sm}
          accessibilityRole="button"
          accessibilityLabel="换一个字"
        >
          <View style={styles.switchFace}>
            <Ionicons name="refresh" size={16} color={COLORS.primaryDeep} />
            <Text style={styles.switchText}>换一个</Text>
          </View>
        </ToyButton>
      </View>
    </View>
  );
};

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
    lineHeight: 18,
    marginTop: 4,
  },
  badge: {
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
    fontFamily: FONT_HANZI,
    fontSize: 11,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  charBubble: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  pinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontSize: 16,
    fontWeight: '700',
  },
  char: {
    color: COLORS.accent,
    fontFamily: FONT_HANZI,
    fontSize: 40,
    fontWeight: '800',
    includeFontPadding: false,
  },
  targetMeta: {
    flex: 1,
    gap: 5,
  },
  metaLine: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
  },
  bestRow: {
    flexDirection: 'row',
    gap: 2,
  },
  metaHint: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  primaryFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: FONT_HANZI,
    fontSize: 14,
    fontWeight: '800',
  },
  starPrompt: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    flex: 1,
  },
  starFace: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  starText: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_PINYIN,
    fontSize: 11,
    fontWeight: '800',
  },
  feedbackText: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerHint: {
    flex: 1,
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 11,
    lineHeight: 16,
  },
  switchFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  switchText: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    lineHeight: 20,
  },
});
