import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AddScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Add Entry</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#777" />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1 p-4">
        <View className="space-y-4">
          <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="nutrition-outline" size={24} color="green" />
            </View>
            <Text className="text-lg font-medium">Add Food</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="water-outline" size={24} color="blue" />
            </View>
            <Text className="text-lg font-medium">Add Water</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow">
            <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="fitness-outline" size={24} color="orange" />
            </View>
            <Text className="text-lg font-medium">Add Workout</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          
          <TouchableOpacity className="bg-white p-4 rounded-lg flex-row items-center shadow">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="body-outline" size={24} color="purple" />
            </View>
            <Text className="text-lg font-medium">Add Weight</Text>
            <Ionicons name="chevron-forward" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}