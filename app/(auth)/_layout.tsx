// app/(auth)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'white' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="signup" options={{ title: 'Create Account' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            title: 'Profile Setup',
            gestureEnabled: false, // Prevent going back during onboarding 
          }} 
        />
      </Stack>
    </>
  );
}