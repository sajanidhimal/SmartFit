import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: 70,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#8A2BE2',
        tabBarInactiveTintColor: '#777',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="fitness/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add/index"
        options={{
          tabBarIcon: ({ color }) => (
            <View className="w-16 h-16 bg-primary rounded-full items-center justify-center bottom-5 shadow-lg shadow-primary/50">
              <Ionicons name="add" color="white" size={32} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}