import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_HANZI } from '../theme';

export interface BuiltInVoiceProfile {
  id: string;
  name: string;
  desc: string;
  pitch: number;
}

export const BUILT_IN_VOICE_PROFILES: BuiltInVoiceProfile[] = [
  { id: '1', name: '温柔姐姐', desc: '柔和、清楚，适合睡前故事', pitch: 1.15 },
  { id: '2', name: '活泼哥哥', desc: '更有精神，适合探险故事', pitch: 0.9 },
  { id: '3', name: '故事老师', desc: '稳定慢读，适合跟读识字', pitch: 1.0 },
  { id: '4', name: '小伙伴', desc: '音调更高，像小朋友讲故事', pitch: 1.4 },
];

interface Props {
  rate: number;
  selectedVoiceId: string;
  onRateChange: (rate: number) => void;
  onVoiceChange: (profile: BuiltInVoiceProfile) => void;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export const SpeechControls: React.FC<Props> = ({
  rate,
  selectedVoiceId,
  onRateChange,
  onVoiceChange,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackWidth, setTrackWidth] = useState(1);

  const selected = useMemo(
    () => BUILT_IN_VOICE_PROFILES.find((p) => p.id === selectedVoiceId) || BUILT_IN_VOICE_PROFILES[0],
    [selectedVoiceId],
  );

  const handlePan = (locationX: number) => {
    const ratio = clamp(locationX / trackWidth, 0, 1);
    // 映射到 1.0 到 2.0
    let nextRate = 1.0 + ratio * 1.0;
    // 吸附到 1.0, 1.5, 2.0
    if (Math.abs(nextRate - 1.0) < 0.25) nextRate = 1.0;
    else if (Math.abs(nextRate - 1.5) < 0.25) nextRate = 1.5;
    else if (Math.abs(nextRate - 2.0) < 0.25) nextRate = 2.0;
    
    nextRate = Math.round(nextRate * 10) / 10;
    onRateChange(nextRate);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handlePan(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handlePan(evt.nativeEvent.locationX);
      },
    })
  ).current;

  // 将 rate 映射回 ratio (0 到 1)
  const ratio = clamp((rate - 1.0) / 1.0, 0, 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.rateHeader}>
        <Text style={styles.label}>语速</Text>
        <Text style={styles.value}>{rate.toFixed(1)}x</Text>
      </View>
      
      {/* 语速滑块 */}
      <View style={styles.sliderContainer}>
        <View
          style={styles.sliderTrack}
          onLayout={(e) => {
            setTrackWidth(e.nativeEvent.layout.width);
          }}
          {...panResponder.panHandlers}
        >
          <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]} pointerEvents="none" />
          <View style={[styles.sliderThumb, { left: `${ratio * 100}%` }]} pointerEvents="none" />
        </View>
        <View style={styles.sliderMarks}>
          <Text style={styles.mark}>1.0x</Text>
          <Text style={styles.mark}>1.5x</Text>
          <Text style={styles.mark}>2.0x</Text>
        </View>
      </View>

      {/* 音色切换入口 */}
      <Pressable
        style={({ pressed }) => [styles.voiceButton, pressed && { opacity: 0.7 }]}
        onPress={() => setDrawerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="选择朗读音源"
      >
        <View>
          <Text style={styles.label}>内置音色</Text>
          <Text style={styles.voiceName}>{selected.name}</Text>
          <Text style={styles.voiceDesc}>{selected.desc}</Text>
        </View>
        <Ionicons name="chevron-up" size={22} color={COLORS.primary} />
      </Pressable>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDrawerOpen(false)} />
        <View style={styles.drawer}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerTitle}>选择内置音色</Text>
          <Text style={styles.drawerHint}>
            这些配置会自动调整声调，产生不同的人物感觉，播放依然完全离线。
          </Text>
          <ScrollView bounces={false}>
            {BUILT_IN_VOICE_PROFILES.map((profile) => {
              const active = profile.id === selectedVoiceId;
              return (
                <Pressable
                  key={profile.id}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onVoiceChange(profile);
                    setDrawerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionName, active && styles.optionNameActive]}>
                      {profile.name}
                    </Text>
                    <Text style={styles.optionDesc}>{profile.desc}</Text>
                  </View>
                  {active ? <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
  },
  sliderContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  sliderTrack: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mark: {
    color: COLORS.textLight,
    fontFamily: FONT_HANZI,
    fontSize: 11,
  },
  // 下面的样式与原先相同...
  voiceButton: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  voiceName: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  voiceDesc: {
    color: COLORS.textLight,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '60%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.card,
    gap: 10,
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    marginBottom: 8,
  },
  drawerTitle: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  drawerHint: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  option: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  optionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FEF3C7',
  },
  optionName: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 16,
    fontWeight: '700',
  },
  optionNameActive: {
    color: COLORS.primaryDeep,
  },
  optionDesc: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
});

