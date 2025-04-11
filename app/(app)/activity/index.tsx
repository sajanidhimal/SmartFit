
import { router } from 'expo-router';
import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold text-gray-800">Activity Screen</Text>
        <Text className="text-gray-600 mt-2 text-center">
          This is where you'll track your workouts and daily activities.
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/(bmi)')}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Calculate BMI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/(steps)')}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Track Steps</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push('/(weight)')}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Track weight</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


