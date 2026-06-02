/**
 * 识字小测验模态：
 *  - 三题：听汉字选字、看汉字选拼音、看拼音选汉字
 *  - 题完毕后调用 onFinish(correctCount, total)
 *  - 干扰项从字库中"同册其它字"随机抽取
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { BouncyPressable } from './BouncyPressable';
import { loadCharacters } from '../data/loadCharacters';
import { COLORS, FONT_HANZI, FONT_PINYIN } from '../theme';
import type { Character } from '../types';

interface Props {
  visible: boolean;
  target: Character;
  onClose: () => void;
  onFinish: (correct: number, total: number) => void;
}

type QuestionType = 'listen' | 'charToPinyin' | 'pinyin';

interface Question {
  type: QuestionType;
  prompt: string;       // 题干提示（如拼音）
  answer: string;       // 正确答案 char
  options: string[];    // 4 个候选 char
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(target: Character, pool: Character[], n: number): string[] {
  const same = pool.filter((c) => c.volume === target.volume && c.char !== target.char);
  const source = same.length >= n ? same : pool.filter((c) => c.char !== target.char);
  return shuffle(source).slice(0, n).map((c) => c.char);
}

function pickPinyinDistractors(target: Character, pool: Character[], n: number): string[] {
  const sameVolume = pool.filter(
    (c) => c.volume === target.volume && c.char !== target.char && c.pinyin !== target.pinyin,
  );
  const fallback = pool.filter((c) => c.char !== target.char && c.pinyin !== target.pinyin);
  const source = sameVolume.length >= n ? sameVolume : fallback;
  const out: string[] = [];
  for (const c of shuffle(source)) {
    if (c.pinyin && !out.includes(c.pinyin)) out.push(c.pinyin);
    if (out.length >= n) break;
  }
  return out;
}

function buildQuestions(target: Character, pool: Character[]): Question[] {
  const distractors = pickDistractors(target, pool, 6);
  const pinyinDistractors = pickPinyinDistractors(target, pool, 3);
  const optionsFor = (start: number) => shuffle([target.char, ...distractors.slice(start, start + 3)]);
  const pinyinOptions = shuffle([target.pinyin, ...pinyinDistractors.slice(0, 3)]);

  return [
    {
      type: 'listen',
      prompt: '听汉字，选汉字',
      answer: target.char,
      options: optionsFor(0),
    },
    {
      type: 'charToPinyin',
      prompt: '看汉字，选拼音',
      answer: target.pinyin,
      options: pinyinOptions,
    },
    {
      type: 'pinyin',
      prompt: '看拼音，选汉字',
      answer: target.char,
      options: optionsFor(3),
    },
  ];
}

export const QuizModal: React.FC<Props> = ({ visible, target, onClose, onFinish }) => {
  const allChars = useMemo(() => loadCharacters(), []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');
  const animOpacity = useRef(new Animated.Value(0)).current;

  // 打开模态：重置题目 / 计数 / 朗读
  useEffect(() => {
    if (!visible) return;
    const qs = buildQuestions(target, allChars);
    setQuestions(qs);
    setStep(0);
    setCorrect(0);
    setPicked(null);
    setPhase('quiz');
    Animated.timing(animOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [visible, target, allChars, animOpacity]);

  // 进入"听汉字选字"题时朗读汉字本身，而不是拼音
  useEffect(() => {
    if (!visible || phase !== 'quiz') return;
    const q = questions[step];
    if (q?.type === 'listen') {
      Speech.stop().catch(() => {});
      // 微延迟，让模态先出现
      const t = setTimeout(() => {
        Speech.speak(target.char, {
          language: 'zh-CN',
          rate: 0.85,
          pitch: 1.05,
        });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [visible, phase, questions, step, target]);

  const handlePick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const right = opt === questions[step].answer;
    if (right) setCorrect((c) => c + 1);
    setTimeout(() => {
      if (step + 1 < questions.length) {
        setPicked(null);
        setStep((s) => s + 1);
      } else {
        setPhase('result');
      }
    }, 700);
  };

  const handleClose = () => {
    Speech.stop().catch(() => {});
    onClose();
  };

  const handleConfirm = () => {
    onFinish(correct, questions.length);
    handleClose();
  };

  const replay = () => {
    Speech.stop().catch(() => {});
    Speech.speak(target.char, {
      language: 'zh-CN',
      rate: 0.85,
      pitch: 1.05,
    });
  };

  const q = questions[step];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: animOpacity }]}>
          {phase === 'quiz' && q ? (
            <>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>识字小测验</Text>
                <Text style={styles.headerCount}>{step + 1} / {questions.length}</Text>
              </View>
              <Text style={styles.promptText}>{q.prompt}</Text>

              {/* 题干区 */}
              <View style={styles.questionArea}>
                {q.type === 'listen' ? (
                  <BouncyPressable onPress={replay} style={styles.listenBtn} scaleTo={0.92}>
                    <Ionicons name="volume-high" size={36} color="#FFFFFF" />
                    <Text style={styles.listenText}>再听一次汉字</Text>
                  </BouncyPressable>
                ) : q.type === 'charToPinyin' ? (
                  <View style={styles.bigCharCard}>
                    <Text style={styles.bigChar}>{target.char}</Text>
                    <Text style={styles.bigCharTip}>给这个字选拼音</Text>
                  </View>
                ) : (
                  <Text style={styles.bigPinyin}>{target.pinyin}</Text>
                )}
              </View>

              {/* 候选 */}
              <View style={styles.optionsRow}>
                {q.options.map((opt) => {
                  const isPicked = picked === opt;
                  const isAnswer = opt === q.answer;
                  const showResult = !!picked;
                  return (
                    <BouncyPressable
                      key={opt}
                      onPress={() => handlePick(opt)}
                      scaleTo={0.9}
                      style={[
                        styles.option,
                        showResult && isPicked && !isAnswer && styles.optionWrong,
                        showResult && isAnswer && styles.optionRight,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={opt}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          q.type === 'charToPinyin' && styles.optionPinyinText,
                        ]}
                      >
                        {opt}
                      </Text>
                      {showResult && isAnswer ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.optionMark} />
                      ) : null}
                      {showResult && isPicked && !isAnswer ? (
                        <Ionicons name="close-circle" size={20} color="#EF4444" style={styles.optionMark} />
                      ) : null}
                    </BouncyPressable>
                  );
                })}
              </View>

              <BouncyPressable onPress={handleClose} style={styles.skipBtn} scaleTo={0.95}>
                <Text style={styles.skipBtnText}>结束测验</Text>
              </BouncyPressable>
            </>
          ) : (
            <ResultView
              correct={correct}
              total={questions.length}
              targetChar={target.char}
              onConfirm={handleConfirm}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const ResultView: React.FC<{
  correct: number;
  total: number;
  targetChar: string;
  onConfirm: () => void;
}> = ({ correct, total, targetChar, onConfirm }) => {
  const allRight = correct === total;
  const allWrong = correct === 0;
  return (
    <View style={styles.resultWrap}>
      <Ionicons
        name={allRight ? 'trophy' : allWrong ? 'sad' : 'happy'}
        size={56}
        color={allRight ? '#F59E0B' : allWrong ? '#EF4444' : '#10B981'}
      />
      <Text style={styles.resultTitle}>
        {allRight ? '太厉害了！' : allWrong ? '再练练这个字' : '不错继续努力'}
      </Text>
      <Text style={styles.resultSub}>
        答对 {correct} / {total}，「{targetChar}」
        {allRight ? '已掌握，过几天再考你' : allWrong ? '加入错字本，明天再练' : '继续在学'}
      </Text>
      <BouncyPressable onPress={onConfirm} style={styles.confirmBtn} scaleTo={0.94}>
        <Text style={styles.confirmText}>好的</Text>
      </BouncyPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 16,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(0,0,0,0.2)' as unknown as string },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerCount: {
    color: COLORS.textMuted,
    fontFamily: FONT_PINYIN,
    fontSize: 13,
    fontWeight: '700',
  },
  promptText: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 15,
    fontWeight: '600',
  },
  questionArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 999,
  },
  listenText: {
    color: '#FFFFFF',
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
  },
  imageWrap: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.borderSoft,
    backgroundColor: COLORS.bg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.borderSoft,
  },
  imagePlaceholderText: {
    fontSize: 60,
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontWeight: '800',
  },
  bigPinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 4,
  },
  bigCharCard: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  bigChar: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 84,
    fontWeight: '900',
    includeFontPadding: false,
  },
  bigCharTip: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    flexGrow: 1,
    minWidth: '47%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.borderSoft,
    position: 'relative',
  },
  optionRight: {
    borderColor: '#10B981',
    backgroundColor: '#DCFCE7',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 36,
    fontWeight: '800',
  },
  optionPinyinText: {
    fontFamily: FONT_PINYIN,
    fontSize: 22,
    letterSpacing: 1,
  },
  optionMark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  skipBtnText: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
  },
  resultWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  resultTitle: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 22,
    fontWeight: '800',
  },
  resultSub: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 15,
    textAlign: 'center',
  },
  confirmBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  confirmText: {
    color: '#FFFFFF',
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '800',
  },
});
