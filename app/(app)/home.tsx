
//home.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularProgress from '../../components/CircularProgress';
import MacroCard from '../../components/MacroCard';
import WeekCalendar from '../../components/WeekCalendar';
import NutritionTracker from '../../components/NutritionDetail';

// Define types for our data
interface MacroNutrient {
  current: number;
  goal: number;
  unit: string;
}

interface DailyStats {
  calories: {
    eaten: number;
    remaining: number;
    burned: number;
    total: number;
  };
  macros: {
    protein: MacroNutrient;
    fats: MacroNutrient;
    carbs: MacroNutrient;
  };
  water: {
    current: number;
    goal: number;
    unit: string;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  
  // Mock data that matches the screenshot
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    calories: {
      eaten: 1209,
      remaining: 948,
      burned: 0,
      total: 2157
    },
    macros: {
      protein: { current: 140, goal: 162, unit: 'g' },
      fats: { current: 30, goal: 48, unit: 'g' },
      carbs: { current: 240, goal: 270, unit: 'g' }
    },
    water: {
      current: 0,
      goal: 8,
      unit: 'Liters'
    }
  });

  // Week days data
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');

  const [weekDays, setWeekDays] = useState([
    { day: 'Sun', date: 22, active: false },
    { day: 'Mon', date: 23, active: false },
    { day: 'Tue', date: 24, active: false },
    { day: 'Wed', date: 25, active: false },
    { day: 'Thu', date: 26, active: false },
    { day: 'Fri', date: 27, active: false },
    { day: 'Sat', date: 28, active: true },
  ]);

  // Calorie stats
  const calorieStats = {
    average: 1670,
    percentage: 57,
    goalPercentage: 77,
    goal: 2157
  };

  const getProgressData = () => {
    // Mock data for the progress chart
    return [
      { label: 'Sun', actual: 60, total: 100 },
      { label: 'Mon', actual: 75, total: 100 },
      { label: 'Tue', actual: 85, total: 100 },
      { label: 'Wed', actual: 70, total: 100 },
      { label: 'Thu', actual: 90, total: 100 },
      { label: 'Fri', actual: 65, total: 100 },
      { label: 'Sat', actual: 80, total: 100 },
    ];
  };

  const selectDay = (index: number) => {
    const updatedWeekDays = weekDays.map((day, i) => ({
      ...day,
      active: i === index
    }));
    setWeekDays(updatedWeekDays);
  };

  const addWater = () => {
    setDailyStats(prev => ({
      ...prev,
      water: {
        ...prev.water,
        current: Math.min(prev.water.current + 1, prev.water.goal)
      }
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 w-full">
      <ScrollView className="flex-1 px-4 mb-16 w-full">
        {/* Header */}
        <View className="flex-row justify-between items-center py-6 w-full">
          <View>
            <Text className="text-lg text-gray-500">Welcome</Text>
            <Text className="text-3xl font-bold text-gray-800">Talha Ch!</Text>
          </View>
          <View className="w-10 h-10 bg-gray-300 rounded-full items-center justify-center">
            <Ionicons name="person" size={24} color="#777" />
          </View>
        </View>

        {/* Main Card */}
        <View className="bg-white rounded-2xl px-4 py-2 shadow flex items-center mb-2">
          {/* Calorie Progress */}
          <View className="flex-row justify-between mb-6 items-end flex mb-2 gap-16">
            <View className="flex-1 items-center">
              <CircularProgress
                size={150}
                strokeWidth={12}
                progress={dailyStats.calories.eaten}
                max={dailyStats.calories.total}
                value={dailyStats.calories.total}
                unit="kcal"
                color="#f8a100"
              />
            </View>
            
            <View className="flex-1 justify-center space-y-4">
              <View>
                <Text className="text-gray-500">Eaten</Text>
                <Text className="text-xl">
                  {dailyStats.calories.eaten} <Text className="text-gray-400 text-sm">kcal</Text>
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-500">remaining</Text>
                <Text className="text-xl">
                  {dailyStats.calories.remaining} <Text className="text-gray-400 text-sm">kcal</Text>
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-500">Burned</Text>
                <Text className="text-xl">
                  {dailyStats.calories.burned} <Text className="text-gray-400 text-sm">kcal</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Macro Nutrients */}
          <View className="flex-row space-x-4 flex gap-2">
            <MacroCard 
              title="Protein"
              current={dailyStats.macros.protein.current}
              goal={dailyStats.macros.protein.goal}
              unit="g"
              bgColor="bg-protein-bg"
              progressColor="#d46b08"
              textColor="text-protein-text"
            />
            <MacroCard 
              title="Fats"
              current={dailyStats.macros.fats.current}
              goal={dailyStats.macros.fats.goal}
              unit="g"
              bgColor="bg-fats-bg"
              progressColor="#b94700"
              textColor="text-fats-text"
            />
            
            <MacroCard 
              title="Carbs"
              current={dailyStats.macros.carbs.current}
              goal={dailyStats.macros.carbs.goal}
              unit="g"
              bgColor="bg-carbs-bg"
              progressColor="#b97a00"
              textColor="text-carbs-text"
            />
          </View>
        </View>

        {/* Week Calendar */}
        <WeekCalendar 
          weekDays={weekDays}
          onPrevWeek={() => console.log('Previous week')}
          onNextWeek={() => console.log('Next week')}
          onSelectDay={selectDay}
        />

        {/* Water Balance */}
        <View className="bg-white rounded-lg p-4 flex-row items-center justify-between shadow mb-4 w-full">
            <View className="w-16 h-24 relative">
            {/* Glass outline */}
            <View className="absolute inset-0 bg-blue-100 rounded-t-lg rounded-b-3xl border-2 border-blue-300" />
            {/* Water fill */}
            <View 
              className="absolute bottom-0 left-0 right-0 bg-blue-400 rounded-b-3xl"
              style={{ 
              height: `${(dailyStats.water.current / dailyStats.water.goal) * 100}%`,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4
              }}
            />
            {/* Glass shine effect */}
            <View className="absolute top-1 right-2 w-2 h-12 bg-white/20 rounded-full" />
            </View>
          
          <View className="flex-1 px-4">
            <Text className="text-lg font-medium text-gray-700">Water Balance</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {dailyStats.water.current} {dailyStats.water.unit}
            </Text>
            <Text className="text-gray-500">
              {dailyStats.water.goal - dailyStats.water.current} Left
            </Text>
          </View>
          
          <TouchableOpacity 
            className="w-12 h-12 bg-secondary rounded-lg items-center justify-center"
            onPress={addWater}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* Calories Section
        <View className="bg-white rounded-lg p-4 shadow mb-16">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-secondary">Calories</Text>
            <Text className="text-gray-600">{calorieStats.average} kcal ({calorieStats.percentage}%)</Text>
          </View>
          
          <Text className="text-gray-600">
            Your average daily calories consumption is {calorieStats.average} kcal which is {calorieStats.goalPercentage}% of your goal ({calorieStats.goal} kcal)
          </Text>
            <View className="mt-2">
            <Text className="text-lg font-semibold mb-8">{selectedPeriod} Progress</Text>
            <View className="h-40 flex-row items-end justify-between">
              {getProgressData().map((item, index) => (
              <View key={index} className="items-center">
                <View 
                className="w-8 bg-secondary/20 rounded-t-lg"
                style={{ 
                  height: `${item.total}%`,
                }}
                >
                <View 
                  className="w-full bg-secondary rounded-t-lg"
                  style={{ 
                  height: `${item.actual}%`,
                  }}
                />
                </View>
                <Text className="text-xs text-gray-500 mt-1">{item.label}</Text>
              </View>
              ))}
            </View>
            <View className="flex-row justify-between mt-4 mb-2">
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((period) => (
              <TouchableOpacity
              key={period}
              className={`px-4 py-2 rounded-full ${
                selectedPeriod === period ? 'bg-secondary' : 'bg-gray-200'
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
        </View> */}
        
        <NutritionTracker/>
      </ScrollView>
    </SafeAreaView>
  );
}