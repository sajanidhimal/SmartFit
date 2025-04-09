import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800">Stats</Text>
        <Text className="text-gray-500">Your fitness analytics and progress</Text>
      </View>
      
      <ScrollView className="flex-1 p-4">
        {/* Weekly Summary Card */}
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Weekly Summary</Text>
          
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <Text className="text-gray-500 text-xs">Calories</Text>
              <Text className="text-lg font-bold text-gray-800">11,690</Text>
              <Text className="text-xs text-green-500">+4.3%</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-gray-500 text-xs">Protein</Text>
              <Text className="text-lg font-bold text-gray-800">980g</Text>
              <Text className="text-xs text-green-500">+2.7%</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-gray-500 text-xs">Workouts</Text>
              <Text className="text-lg font-bold text-gray-800">5</Text>
              <Text className="text-xs text-red-500">-1</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-gray-500 text-xs">Water</Text>
              <Text className="text-lg font-bold text-gray-800">38L</Text>
              <Text className="text-xs text-green-500">+2L</Text>
            </View>
          </View>
          
          {/* Simplified chart representation */}
          <View className="h-32 flex-row items-end justify-between mt-4 mb-2">
            {[65, 82, 73, 90, 86, 78, 92].map((value, index) => (
              <View key={index} className="flex-1 mx-1">
                <View 
                  className="bg-primary rounded-t-md" 
                  style={{ height: `${value}%` }}
                />
              </View>
            ))}
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">Mon</Text>
            <Text className="text-xs text-gray-500">Tue</Text>
            <Text className="text-xs text-gray-500">Wed</Text>
            <Text className="text-xs text-gray-500">Thu</Text>
            <Text className="text-xs text-gray-500">Fri</Text>
            <Text className="text-xs text-gray-500">Sat</Text>
            <Text className="text-xs text-gray-500">Sun</Text>
          </View>
        </View>
        
        {/* Weight Progress */}
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Weight Progress</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-primary mr-1">Monthly</Text>
              <Ionicons name="chevron-down" size={16} color="#8A2BE2" />
            </TouchableOpacity>
          </View>
          
          {/* Simplified weight chart */}
          <View className="h-32 flex-row items-end justify-between mt-4 mb-2">
            {[75, 74.5, 74, 73.8, 73.5, 73.2, 72.8].map((value, index) => (
              <View key={index} className="flex-1 items-center">
                <View className="w-2 bg-secondary rounded-t-md" style={{ height: `${(value - 70) * 20}%` }} />
              </View>
            ))}
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-xs text-gray-500">W1</Text>
            <Text className="text-xs text-gray-500">W2</Text>
            <Text className="text-xs text-gray-500">W3</Text>
            <Text className="text-xs text-gray-500">W4</Text>
            <Text className="text-xs text-gray-500">W5</Text>
            <Text className="text-xs text-gray-500">W6</Text>
            <Text className="text-xs text-gray-500">W7</Text>
          </View>
          
          <View className="flex-row justify-between items-center mt-4 p-3 bg-gray-50 rounded-lg">
            <View>
              <Text className="text-gray-500">Starting Weight</Text>
              <Text className="text-lg font-bold">75 kg</Text>
            </View>
            
            <View>
              <Text className="text-gray-500">Current Weight</Text>
              <Text className="text-lg font-bold">72.8 kg</Text>
            </View>
            
            <View>
              <Text className="text-gray-500">Goal Weight</Text>
              <Text className="text-lg font-bold">70 kg</Text>
            </View>
          </View>
        </View>
        
        {/* Nutritional Insights */}
        <View className="bg-white rounded-lg p-4 shadow mb-16">
          <Text className="text-xl font-bold text-gray-800 mb-4">Nutritional Insights</Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700">Protein Intake</Text>
              <Text className="text-gray-900 font-medium">140g/day</Text>
            </View>
            
            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-green-500 rounded-full" style={{ width: '86%' }} />
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700">Carbs Intake</Text>
              <Text className="text-gray-900 font-medium">240g/day</Text>
            </View>
            
            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-blue-500 rounded-full" style={{ width: '89%' }} />
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700">Fats Intake</Text>
              <Text className="text-gray-900 font-medium">30g/day</Text>
            </View>
            
            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-orange-500 rounded-full" style={{ width: '62%' }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}