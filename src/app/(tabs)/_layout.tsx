import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import { color } from '@/theme/tokens';

function HomeIcon({ color: strokeColor, focused }: { color: string; focused?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={focused ? 2.3 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

function ProgressIcon({ color: strokeColor, focused }: { color: string; focused?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={focused ? 2.3 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  );
}

function ProfileIcon({ color: strokeColor, focused }: { color: string; focused?: boolean }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={focused ? 2.3 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.inkTertiary,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(227,233,247,0.72)' : color.tabBar,
          borderTopColor: color.hairline,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 70,
          paddingBottom: Platform.OS === 'ios' ? 26 : 12,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint="light"
              intensity={45}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabel: ({ focused, color: labelColor, children }) => (
          <Text
            style={{
              fontSize: 11,
              fontFamily: focused ? 'Geist-Bold' : 'Geist-Medium',
              fontWeight: focused ? '700' : '500',
              color: labelColor,
              marginTop: 2,
            }}
          >
            {children}
          </Text>
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color: c, focused }) => <HomeIcon color={String(c || color.ink)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color: c, focused }) => <ProgressIcon color={String(c || color.inkTertiary)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="companion"
        options={{
          href: null,
          title: 'Companion',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color: c, focused }) => <ProfileIcon color={String(c || color.inkTertiary)} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
