import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS, FONT_HANZI } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryDeep,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: {
          fontFamily: FONT_HANZI,
          fontSize: 12,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '大本营',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "rocket" : "rocket-outline"} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: '字卡库',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "albums" : "albums-outline"} size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '小成就',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "star" : "star-outline"} size={size + 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 2,
    borderTopColor: COLORS.borderSoft,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 4,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
  },
});
