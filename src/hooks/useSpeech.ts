/**
 * useSpeech：跨平台中文 TTS 朗读 Hook（系统语音、离线、不要 Key）
 *
 * - iOS / Android：用 expo-speech 调系统 TTS 引擎
 * - Web：用浏览器 SpeechSynthesis API（由 expo-speech 内部封装）
 *
 * 用法：
 *   const { isSpeaking, toggle } = useSpeech(text, { rate: 0.8, voice: 'xxx' });
 *   <Pressable onPress={toggle}>...</Pressable>
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

interface UseSpeechOptions {
  /** 语言 / 区域，默认 zh-CN（普通话） */
  language?: string;
  /** 语速 0.1-2.0，默认 1.0 */
  rate?: number;
  /** 音调 0.5-2.0，默认 1.0 */
  pitch?: number;
  /** 系统语音 ID，不传则使用系统默认中文语音 */
  voice?: string;
}

export function useSpeech(text: string, opts: UseSpeechOptions = {}) {
  const { language = 'zh-CN', rate = 1.0, pitch = 1.0, voice } = opts;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);
  const monitorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearMonitor = useCallback(() => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearMonitor();
      Speech.stop().catch(() => {});
    };
  }, [clearMonitor]);

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
    } finally {
      clearMonitor();
      if (mountedRef.current) setIsSpeaking(false);
    }
  }, [clearMonitor]);

  const speak = useCallback(async () => {
    if (!text) return;
    try {
      await Speech.stop();
    } catch {
      /* 没事 */
    }
    if (!mountedRef.current) return;

    clearMonitor();
    setIsSpeaking(true);
    
    // 强制包装选项，如果 voice 存在则优先
    const speechOptions: Speech.SpeechOptions = {
      language,
      rate,
      pitch,
      onDone: () => {
        clearMonitor();
        if (mountedRef.current) setIsSpeaking(false);
      },
      onStopped: () => {
        clearMonitor();
        if (mountedRef.current) setIsSpeaking(false);
      },
      onError: () => {
        clearMonitor();
        if (mountedRef.current) setIsSpeaking(false);
      },
    };
    
    if (voice) {
      speechOptions.voice = voice;
    }

    Speech.speak(text, speechOptions);

    // 兜底轮询
    monitorRef.current = setInterval(async () => {
      try {
        const speaking = await Speech.isSpeakingAsync();
        if (!speaking) {
          clearMonitor();
          if (mountedRef.current) setIsSpeaking(false);
        }
      } catch {
        clearMonitor();
        if (mountedRef.current) setIsSpeaking(false);
      }
    }, 500);
  }, [text, language, rate, pitch, voice, clearMonitor]);

  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop();
    } else {
      speak();
    }
  }, [isSpeaking, speak, stop]);

  return { isSpeaking, speak, stop, toggle };
}
