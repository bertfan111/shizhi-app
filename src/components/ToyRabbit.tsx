import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Props {
  /** 当前等级 1~8。装饰按等级独立替换 */
  level: number;
}

/**
 * 「识字小兔」吉祥物。
 *
 * 内置呼吸 / 眨眼 / 动耳朵循环动效，
 * 并根据 `level` 在头部叠加对应的装饰：
 *
 *  Lv1 无装饰；
 *  Lv2 蝴蝶结；Lv3 花环；Lv4 耳机；Lv5 围巾；
 *  Lv6 圆框眼镜；Lv7 金皇冠 + 宝石；Lv8 博士帽 + 光环。
 */
export const ToyRabbit: React.FC<Props> = ({ level }) => {
  const breathAnim = useRef(new Animated.Value(1)).current;
  const eyeAnim = useRef(new Animated.Value(1)).current;
  const leftEarAnim = useRef(new Animated.Value(0)).current;
  const rightEarAnim = useRef(new Animated.Value(0)).current;
  const haloAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 呼吸动效
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    // 眨眼动效
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const blink = () => {
      Animated.sequence([
        Animated.timing(eyeAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(eyeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      blinkTimeout = setTimeout(blink, Math.random() * 3000 + 2000);
    };
    blinkTimeout = setTimeout(blink, 1000);

    // 动耳朵
    let twitchTimeout: ReturnType<typeof setTimeout>;
    const twitchEar = () => {
      const isLeft = Math.random() > 0.5;
      const anim = isLeft ? leftEarAnim : rightEarAnim;
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
      twitchTimeout = setTimeout(twitchEar, Math.random() * 4000 + 2000);
    };
    twitchTimeout = setTimeout(twitchEar, 2000);

    // 满级光环（仅 Lv8）持续呼吸
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(haloAnim, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(twitchTimeout);
    };
  }, [breathAnim, eyeAnim, leftEarAnim, rightEarAnim, haloAnim]);

  const leftEarRot = leftEarAnim.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '-35deg'] });
  const rightEarRot = rightEarAnim.interpolate({ inputRange: [0, 1], outputRange: ['15deg', '35deg'] });

  return (
    <View style={styles.outer}>
      {/* Lv8 光环：在最底层，独立于呼吸动画 */}
      {level >= 8 ? (
        <Animated.View style={[styles.halo, { opacity: haloAnim }]} />
      ) : null}

      <Animated.View style={[styles.container, { transform: [{ scale: breathAnim }] }]}>
        {/* 围巾在脖子位置（在身体最底层）*/}
        {level === 5 ? <Scarf /> : null}

        {/* 耳朵 */}
        <View style={styles.earsRow}>
          <Animated.View
            style={[
              styles.ear,
              { transformOrigin: 'bottom', transform: [{ rotate: leftEarRot }] } as any,
            ]}
          >
            <View style={styles.earInner} />
          </Animated.View>
          <Animated.View
            style={[
              styles.ear,
              { transformOrigin: 'bottom', transform: [{ rotate: rightEarRot }] } as any,
            ]}
          >
            <View style={styles.earInner} />
          </Animated.View>
        </View>

        {/* 脑袋 */}
        <View style={styles.head}>
          {/* 等级装饰按 level 替换 */}
          {level === 2 ? <Bow /> : null}
          {level === 3 ? <FlowerCrown /> : null}
          {level === 4 ? <Headphones /> : null}
          {level === 6 ? <Glasses /> : null}
          {level === 7 ? <Crown /> : null}
          {level >= 8 ? <GraduateCap /> : null}

          {/* 眼睛 */}
          <View style={styles.eyesRow}>
            <Animated.View style={[styles.eye, { transform: [{ scaleY: eyeAnim }] }]} />
            <Animated.View style={[styles.eye, { transform: [{ scaleY: eyeAnim }] }]} />
          </View>
          {/* 腮红 */}
          <View style={styles.blushRow}>
            <View style={styles.blush} />
            <View style={styles.blush} />
          </View>
          {/* 鼻子嘴巴 */}
          <View style={styles.noseRow}>
            <View style={styles.nose} />
            <View style={styles.mouth} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ====================== 装饰子组件 ======================

/** Lv2 蝴蝶结：两叶 + 中心打结 */
const Bow: React.FC = () => (
  <View style={styles.bow} pointerEvents="none">
    <View style={[styles.bowWing, styles.bowWingLeft]} />
    <View style={[styles.bowWing, styles.bowWingRight]} />
    <View style={styles.bowKnot} />
  </View>
);

/** Lv3 花环：5 朵小花在头顶弧线排开 */
const FlowerCrown: React.FC = () => {
  const colors = ['#F472B6', '#A78BFA', '#FBBF24', '#60A5FA', '#34D399'];
  return (
    <View style={styles.flowerCrown} pointerEvents="none">
      {colors.map((color, i) => (
        <View key={i} style={[styles.flowerWrap, { marginTop: i === 2 ? -4 : i === 1 || i === 3 ? -2 : 0 }]}>
          <View style={[styles.flowerPetal, styles.flowerPetalTop, { backgroundColor: color }]} />
          <View style={[styles.flowerPetal, styles.flowerPetalBottom, { backgroundColor: color }]} />
          <View style={[styles.flowerPetal, styles.flowerPetalLeft, { backgroundColor: color }]} />
          <View style={[styles.flowerPetal, styles.flowerPetalRight, { backgroundColor: color }]} />
          <View style={styles.flowerCenter} />
        </View>
      ))}
    </View>
  );
};

/** Lv4 耳机：横跨头顶的金属带 + 两侧耳罩 */
const Headphones: React.FC = () => (
  <View style={styles.headphones} pointerEvents="none">
    <View style={styles.headphoneArc} />
    <View style={styles.headphoneArcShadow} />
    <View style={[styles.headphoneCup, styles.headphoneCupLeft]}>
      <View style={styles.headphoneCupInner} />
    </View>
    <View style={[styles.headphoneCup, styles.headphoneCupRight]}>
      <View style={styles.headphoneCupInner} />
    </View>
  </View>
);

/** Lv5 围巾：横绕脖颈 + 一端飘出流苏 */
const Scarf: React.FC = () => (
  <View style={styles.scarf} pointerEvents="none">
    <View style={styles.scarfBand} />
    <View style={styles.scarfTail}>
      <View style={[styles.scarfTailStripe, { backgroundColor: '#F87171' }]} />
      <View style={[styles.scarfTailStripe, { backgroundColor: '#FFFFFF' }]} />
      <View style={[styles.scarfTailStripe, { backgroundColor: '#FBBF24' }]} />
      <View style={styles.scarfFringe} />
    </View>
  </View>
);

/** Lv6 眼镜：两个圆框 + 中央桥 */
const Glasses: React.FC = () => (
  <View style={styles.glasses} pointerEvents="none">
    <View style={styles.glassLens} />
    <View style={styles.glassBridge} />
    <View style={styles.glassLens} />
  </View>
);

/** Lv7 金皇冠：金底座 + 三尖 + 三宝石 */
const Crown: React.FC = () => (
  <View style={styles.crown} pointerEvents="none">
    <View style={styles.crownPoints}>
      <View style={[styles.crownPoint, styles.crownPointSide]}>
        <View style={[styles.crownGem, { backgroundColor: '#60A5FA', top: 4 }]} />
      </View>
      <View style={[styles.crownPoint, styles.crownPointCenter]}>
        <View style={[styles.crownGem, styles.crownGemLarge, { backgroundColor: '#EF4444', top: 6 }]} />
      </View>
      <View style={[styles.crownPoint, styles.crownPointSide]}>
        <View style={[styles.crownGem, { backgroundColor: '#A78BFA', top: 4 }]} />
      </View>
    </View>
    <View style={styles.crownBase} />
  </View>
);

/** Lv8 博士帽：黑方顶 + 流苏 */
const GraduateCap: React.FC = () => (
  <View style={styles.gradCap} pointerEvents="none">
    <View style={styles.gradCapTop} />
    <View style={styles.gradCapBase} />
    <View style={styles.gradCapTasselLine} />
    <View style={styles.gradCapTasselBall} />
  </View>
);

const styles = StyleSheet.create({
  outer: {
    width: 96,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 80,
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // ===== 兔子主体 =====
  earsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 44,
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  ear: {
    width: 18,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    paddingTop: 4,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  earInner: {
    width: 8,
    height: 26,
    backgroundColor: '#FBCFE8',
    borderRadius: 4,
  },
  head: {
    width: 68,
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 29,
    borderBottomWidth: 4,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    paddingTop: 18,
  },
  hairTuft: {
    display: 'none',
  },
  eyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32,
    zIndex: 1,
  },
  eye: {
    width: 8,
    height: 12,
    backgroundColor: '#1F2937',
    borderRadius: 4,
  },
  blushRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 48,
    position: 'absolute',
    top: 28,
  },
  blush: {
    width: 10,
    height: 6,
    backgroundColor: '#FCE7F3',
    borderRadius: 4,
  },
  noseRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  nose: {
    width: 8,
    height: 5,
    backgroundColor: '#F43F5E',
    borderRadius: 4,
  },
  mouth: {
    width: 12,
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#D1D5DB',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: 1,
  },

  // ===== Lv2 蝴蝶结 =====
  bow: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 24,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  bowWing: {
    position: 'absolute',
    width: 11,
    height: 13,
    backgroundColor: '#F472B6',
    borderWidth: 1.5,
    borderColor: '#DB2777',
    borderRadius: 7,
  },
  bowWingLeft: {
    left: 0,
    transform: [{ rotate: '-18deg' }],
  },
  bowWingRight: {
    right: 0,
    transform: [{ rotate: '18deg' }],
  },
  bowKnot: {
    width: 6,
    height: 8,
    backgroundColor: '#DB2777',
    borderRadius: 3,
    zIndex: 1,
  },

  // ===== Lv3 花环 =====
  flowerCrown: {
    position: 'absolute',
    top: -10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    zIndex: 3,
  },
  flowerWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flowerPetal: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  flowerPetalTop: { top: 0 },
  flowerPetalBottom: { bottom: 0 },
  flowerPetalLeft: { left: 0 },
  flowerPetalRight: { right: 0 },
  flowerCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FCD34D',
    zIndex: 1,
  },

  // ===== Lv4 耳机 =====
  headphones: {
    position: 'absolute',
    top: -8,
    width: 64,
    height: 24,
    alignItems: 'center',
    zIndex: 3,
  },
  headphoneArc: {
    position: 'absolute',
    top: 0,
    width: 46,
    height: 22,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: '#1F2937',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomWidth: 0,
  },
  headphoneArcShadow: {
    position: 'absolute',
    top: 2,
    width: 42,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#6B7280',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 0,
  },
  headphoneCup: {
    position: 'absolute',
    top: 14,
    width: 14,
    height: 16,
    borderRadius: 7,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headphoneCupInner: {
    width: 7,
    height: 9,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
  },
  headphoneCupLeft: {
    left: 0,
  },
  headphoneCupRight: {
    right: 0,
  },

  // ===== Lv5 围巾 =====
  scarf: {
    position: 'absolute',
    bottom: -2,
    width: 84,
    height: 22,
    alignItems: 'center',
    zIndex: 3,
  },
  scarfBand: {
    width: 72,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  scarfTail: {
    position: 'absolute',
    right: 6,
    top: 8,
    width: 10,
    height: 18,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 4,
  },
  scarfTailStripe: {
    width: '100%',
    height: 4,
  },
  scarfFringe: {
    width: 10,
    height: 4,
    backgroundColor: '#EF4444',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  // ===== Lv6 眼镜 =====
  glasses: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 4,
  },
  glassLens: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#1F2937',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  glassBridge: {
    width: 6,
    height: 2.5,
    backgroundColor: '#1F2937',
  },

  // ===== Lv7 金皇冠 =====
  crown: {
    position: 'absolute',
    top: -16,
    alignItems: 'center',
    zIndex: 3,
  },
  crownPoints: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  crownPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FBBF24',
    marginHorizontal: -2,
    position: 'relative',
  },
  crownPointSide: {
    borderBottomWidth: 14,
  },
  crownPointCenter: {
    borderBottomWidth: 18,
    marginBottom: 0,
  },
  crownGem: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    left: -2.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  crownGemLarge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    left: -3,
  },
  crownBase: {
    width: 40,
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#B45309',
    marginTop: -1,
  },

  // ===== Lv8 博士帽 =====
  gradCap: {
    position: 'absolute',
    top: -14,
    width: 56,
    height: 22,
    alignItems: 'center',
    zIndex: 3,
  },
  gradCapTop: {
    width: 46,
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    transform: [{ skewY: '-4deg' }],
  },
  gradCapBase: {
    position: 'absolute',
    top: 6,
    width: 32,
    height: 8,
    backgroundColor: '#374151',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  gradCapTasselLine: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 1.5,
    height: 14,
    backgroundColor: '#FBBF24',
  },
  gradCapTasselBall: {
    position: 'absolute',
    top: 16,
    right: 3,
    width: 6,
    height: 7,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
    borderWidth: 0.5,
    borderColor: '#B45309',
  },

  // ===== Lv8 光环 =====
  halo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'rgba(251, 191, 36, 0.55)',
    backgroundColor: 'rgba(254, 243, 199, 0.35)',
  },
});
