//components/nutrition_detail.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function NutritionTracker() {
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  
  // Sample data - would be replaced with actual data in your application
  const calorieStats = { average: 1850, percentage: 92, goal: 2000, goalPercentage: 92 };
  const proteinStats = { average: 120, percentage: 96, goal: 125, goalPercentage: 96 };
  const carbStats = { average: 210, percentage: 84, goal: 250, goalPercentage: 84 };
  const fatStats = { average: 65, percentage: 108, goal: 60, goalPercentage: 108 };
  
  // Simulated progress data function
  const getProgressData = (type: 'calories' | 'protein' | 'carbs' | 'fat' = 'calories') => {
    // This would come from actual user data
    const data = {
      calories: [
        { label: 'Mon', actual: 90, total: 100 },
        { label: 'Tue', actual: 85, total: 100 },
        { label: 'Wed', actual: 95, total: 100 },
        { label: 'Thu', actual: 80, total: 100 },
        { label: 'Fri', actual: 95, total: 100 },
        { label: 'Sat', actual: 70, total: 100 },
        { label: 'Sun', actual: 60, total: 100 },
      ],
      protein: [
        { label: 'Mon', actual: 95, total: 100 },
        { label: 'Tue', actual: 90, total: 100 },
        { label: 'Wed', actual: 100, total: 100 },
        { label: 'Thu', actual: 85, total: 100 },
        { label: 'Fri', actual: 90, total: 100 },
        { label: 'Sat', actual: 80, total: 100 },
        { label: 'Sun', actual: 75, total: 100 },
      ],
      carbs: [
        { label: 'Mon', actual: 80, total: 100 },
        { label: 'Tue', actual: 75, total: 100 },
        { label: 'Wed', actual: 85, total: 100 },
        { label: 'Thu', actual: 70, total: 100 },
        { label: 'Fri', actual: 90, total: 100 },
        { label: 'Sat', actual: 65, total: 100 },
        { label: 'Sun', actual: 55, total: 100 },
      ],
      fat: [
        { label: 'Mon', actual: 110, total: 100 },
        { label: 'Tue', actual: 105, total: 100 },
        { label: 'Wed', actual: 100, total: 100 },
        { label: 'Thu', actual: 115, total: 100 },
        { label: 'Fri', actual: 105, total: 100 },
        { label: 'Sat', actual: 95, total: 100 },
        { label: 'Sun', actual: 90, total: 100 },
      ]
    };
    
    return data[type];
  };
  
  // Nutrition section component
  const NutritionSection = ({ title, stats, type, color }: { title: string; stats: { average: number; percentage: number; goal: number; goalPercentage: number }; type: 'calories' | 'protein' | 'carbs' | 'fat'; color: string }) => (
    <View className="bg-white rounded-lg shadow mb-8 p-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`text-2xl font-bold text-${color}`}>{title}</Text>
        <Text className="text-gray-600">{stats.average} {type === 'calories' ? 'kcal' : 'g'} ({stats.percentage}%)</Text>
      </View>
      
      <Text className="text-gray-600">
        Your average daily {title.toLowerCase()} consumption is {stats.average} {type === 'calories' ? 'kcal' : 'g'} which is {stats.goalPercentage}% of your goal ({stats.goal} {type === 'calories' ? 'kcal' : 'g'})
      </Text>
      
      <View className="mt-2">
        <Text className="text-lg font-semibold mb-8">{selectedPeriod} Progress</Text>
        <View className="h-40 flex-row items-end justify-between">
          {getProgressData(type).map((item, index) => (
            <View key={index} className="items-center">
              <View
                className={`w-8 bg-${color}/20 rounded-t-lg`}
                style={{
                  height: `${item.total}%`,
                }}
              >
                <View
                  className={`w-full bg-${color} rounded-t-lg`}
                  style={{
                    height: `${item.actual}%`,
                  }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">{item.label}</Text>
            </View>
          ))}
        </View>
        
        {/* Time Period Selector */}
        <View className="flex-row justify-between mt-4 mb-2">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((period) => (
            <TouchableOpacity
              key={period}
              className={`px-4 py-2 rounded-full ${
                selectedPeriod === period ? `bg-${color}` : 'bg-gray-200'
              }`}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                className={`${
                  selectedPeriod === period ? 'text-white' : 'text-gray-600'
                }`}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View className="">
      <NutritionSection 
        title="Calories" 
        stats={calorieStats} 
        type="calories" 
        color="secondary" 
      />
      
      <NutritionSection 
        title="Protein" 
        stats={proteinStats} 
        type="protein" 
        color="blue-500" 
      />
      
      <NutritionSection 
        title="Carbs" 
        stats={carbStats} 
        type="carbs" 
        color="green-500" 
      />
      
      <NutritionSection 
        title="Fat" 
        stats={fatStats} 
        type="fat" 
        color="orange-500" 
      />
    </View>
  );
}

