import React from 'react';
import { Redirect } from 'expo-router';

export default function AuthScreen() {
  return <Redirect href="/(tabs)/home" />;
}
