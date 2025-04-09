import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-800">Activity Screen</Text>
        <Text className="text-gray-600 mt-2 text-center">
          This is where you'll track your workouts and daily activities.
        </Text>
      </View>
    </SafeAreaView>
  );
}