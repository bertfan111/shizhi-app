import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface BouncyPressableProps extends PressableProps {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  scaleTo?: number;
}

/**
 * 一个童趣 Q弹 按钮：
 * 只要按下去，就会有一个微小的缩放缩小动画，松开后弹回。
 */
export const BouncyPressable: React.FC<BouncyPressableProps> = ({
  style,
  children,
  scaleTo = 0.92,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
    if (onPressOut) onPressOut(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {(state) => (
        <Animated.View
          style={[
            typeof style === 'function' ? style(state) : style,
            { transform: [{ scale }] },
          ]}
        >
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
};
