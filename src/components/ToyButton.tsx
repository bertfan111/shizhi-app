import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle, View } from 'react-native';

interface ToyButtonProps extends Omit<PressableProps, 'style'> {
  color?: string;       // 按钮正面颜色
  shadowColor?: string; // 按钮侧面/底部厚度颜色
  thickness?: number;   // 3D 厚度
  radius?: number;      // 圆角大小
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * 3D 玩具风按钮：
 * 拥有真实的物理厚度，按下时按钮正面会真实凹陷下去。
 */
export const ToyButton: React.FC<ToyButtonProps> = ({
  color = '#FFFFFF',
  shadowColor = '#E5E7EB',
  thickness = 6,
  radius = 24,
  style,
  children,
  onPressIn,
  onPressOut,
  ...props
}) => {
  // 记录正面视图的垂直偏移量：未按下时顶起(-thickness)，按下时压平(0)
  const translateY = useRef(new Animated.Value(-thickness)).current;

  const handlePressIn = (e: any) => {
    Animated.timing(translateY, {
      toValue: 0, // 压下去
      duration: 50,
      useNativeDriver: true,
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(translateY, {
      toValue: -thickness, // 弹回来
      speed: 20,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
    if (onPressOut) onPressOut(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style]} // 外部传入的外边距等
      {...props}
    >
      <View
        style={{
          backgroundColor: shadowColor,
          borderRadius: radius,
          paddingBottom: thickness, // 底部留出厚度空间
        }}
      >
        <Animated.View
          style={{
            backgroundColor: color,
            borderRadius: radius,
            transform: [{ translateY }],
            // 为了防止子元素被裁切，需要 overflow
            overflow: 'hidden',
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
};
