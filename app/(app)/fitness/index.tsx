import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800">Fitness</Text>
        <Text className="text-gray-500">Your workout plans and routines</Text>
      </View>
      
      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Today's Workout</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                <Ionicons name="barbell" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Upper Body Strength</Text>
                <Text className="text-gray-500 text-sm">45 mins • 5 exercises</Text>
              </View>
              <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
                <Text className="text-white font-medium">Start</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
              <View className="w-10 h-10 bg-secondary rounded-full items-center justify-center mr-3">
                <Ionicons name="flame" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-medium">Cardio Session</Text>
                <Text className="text-gray-500 text-sm">30 mins • 3 exercises</Text>
              </View>
              <TouchableOpacity className="bg-secondary px-4 py-2 rounded-full">
                <Text className="text-white font-medium">Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Workout Programs</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <TouchableOpacity className="mr-4 w-40 h-24 bg-primary rounded-lg items-center justify-center">
              <Ionicons name="body" size={28} color="white" />
              <Text className="text-white font-medium mt-2">Full Body</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="mr-4 w-40 h-24 bg-secondary rounded-lg items-center justify-center">
              <Ionicons name="bicycle" size={28} color="white" />
              <Text className="text-white font-medium mt-2">Cardio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="mr-4 w-40 h-24 bg-green-500 rounded-lg items-center justify-center">
              <Ionicons name="barbell" size={28} color="white" />
              <Text className="text-white font-medium mt-2">Strength</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}