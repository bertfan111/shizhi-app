import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_HANZI, GRADIENTS } from '../../src/theme';

type TabIconName = keyof typeof Ionicons.glyphMap;

function ToyTabIcon({
  focused,
  name,
  color,
}: {
  focused: boolean;
  name: TabIconName;
  color: string;
}) {
  return (
    <View
      style={[
        styles.iconShell,
        focused ? styles.iconShellActive : styles.iconShellIdle,
      ]}
    >
      <LinearGradient
        colors={focused ? GRADIENTS.yellowButton : GRADIENTS.blueButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconFace, focused && styles.iconFaceActive]}
      >
        <Ionicons name={name} size={23} color={focused ? COLORS.primaryDeep : color} />
      </LinearGradient>
    </View>
  );
}

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
        tabBarBackground: () => (
          <LinearGradient
            colors={GRADIENTS.tab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBarBg}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '大本营',
          tabBarIcon: ({ color, focused }) => (
            <ToyTabIcon focused={focused} name={focused ? 'rocket' : 'rocket-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: '字卡库',
          tabBarIcon: ({ color, focused }) => (
            <ToyTabIcon focused={focused} name={focused ? 'albums' : 'albums-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '小成就',
          tabBarIcon: ({ color, focused }) => (
            <ToyTabIcon focused={focused} name={focused ? 'star' : 'star-outline'} color={color} />
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
  iconShell: {
    width: 42,
    height: 34,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 4,
  },
  iconShellIdle: {
    backgroundColor: '#BFEAFF',
  },
  iconShellActive: {
    backgroundColor: COLORS.toyOrange.shadow,
  },
  iconFace: {
    width: 42,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    transform: [{ translateY: -4 }],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  iconFaceActive: {
    backgroundColor: COLORS.toyOrange.base,
  },
});
