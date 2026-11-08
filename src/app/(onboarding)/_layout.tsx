import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
      <Stack.Screen name="intro" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="plan-reveal" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}

