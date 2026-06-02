import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * 页面统一背景：淡黄色到淡蓝色的柔和渐变。
 * 作为最外层容器使用，不改变页面内部布局。
 */
export const GradientBackground: React.FC<Props> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={GRADIENTS.page}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
