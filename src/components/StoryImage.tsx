import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface Props {
  char: string;
  width: number;
  height: number;
}

/**
 * 故事页顶部插图。
 * 统一使用默认插图，避免批量故事图缺失时体验不一致。
 */
export const StoryImage: React.FC<Props> = ({ char, width, height }) => {
  return (
    <View style={[styles.wrap, { width, height }]}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width, height }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`${char} 字的默认故事插图`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#FDE68A',
  },
});
