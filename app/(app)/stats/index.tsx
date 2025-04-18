import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/app/firebase';
import { getWeeklySummary } from '@/app/utils/database_service/summary_functions';
import { getWeightProgressByDateRange } from '@/app/utils/database_service/progress_tracking_functions';
import { getUserProfile } from '@/app/utils/database_service/profile_functions';

export default function StatsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingStates, setLoadingStates] = useState({
    summary: true,
    profile: true
  });
  
  // Get current user memoized
  const currentUser = useMemo(() => auth.currentUser, []);
  
  // Use effect to watch auth changes
  useEffect(() => {
    if (!currentUser) {
      console.log('No user logged in');
    }
  }, [currentUser]);
  
  // Create fetch functions for individual data types
  const fetchWeeklySummary = useCallback(async () => {
    if (!currentUser?.uid) return null;
    
    try {
      // Get start of current week (Monday instead of Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      // Set to previous Monday (1 = Monday, 0 = Sunday)
      startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get weekly summary data
      const { success, data: weeklySummary, error: weeklyError } = await getWeeklySummary(currentUser.uid, startOfWeek);
      
      if (success && weeklySummary) {
        return weeklySummary;
      } else if (weeklyError) {
        console.error("Error fetching weekly data:", weeklyError);
        return null;
      }
      return null;
    } catch (err) {
      console.error("Error in fetchWeeklySummary:", err);
      return null;
    }
  }, [currentUser?.uid]);
  
  const fetchUserProfile = useCallback(async () => {
    if (!currentUser?.uid) return null;
    
    try {
      const { success: profileSuccess, data: profileData } = await getUserProfile(currentUser.uid);
      if (profileSuccess && profileData) {
        return profileData;
      }
      return null;
    } catch (err) {
      console.error("Error in fetchUserProfile:", err);
      return null;
    }
  }, [currentUser?.uid]);
  
  // Main data fetching function - runs in parallel now
  const fetchData = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    setLoading(true);
    setLoadingStates({ summary: true, profile: true });
    
    try {
      // Fetch data in parallel
      const [summaryData, profileData] = await Promise.all([
        fetchWeeklySummary().then(data => {
          setLoadingStates(prev => ({ ...prev, summary: false }));
          return data;
        }),
        fetchUserProfile().then(data => {
          setLoadingStates(prev => ({ ...prev, profile: false }));
          return data;
        })
      ]);
      
      if (summaryData) {
        setWeeklyData(summaryData);
      }
      
      if (profileData) {
        setUserProfile(profileData);
      }
    } catch (err) {
      console.error("Error fetching stats data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, fetchWeeklySummary, fetchUserProfile]);
  
  // Initial data loading
  useEffect(() => {
    fetchData();
    
    // Add cleanup function
    return () => {
      // Cancel any pending operations if needed
    };
  }, [fetchData]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);
  
  // Memoized computed data to avoid recalculating on every render
  const dailyData = useMemo(() => {
    const calculateDailyData = (type: 'calories' | 'protein' | 'carbs' | 'fats' | 'workouts'): number[] => {
      if (!weeklyData || weeklyData.length === 0) {
        return [0, 0, 0, 0, 0, 0, 0]; // Default zeros for 7 days (Mon-Sun)
      }
      
      const result = new Array(7).fill(0);
      
      weeklyData.forEach((day, index) => {
        if (index < 7) {
          if (type === 'calories') {
            result[index] = Math.round(day.totalCaloriesIn || 0);
          } else if (type === 'workouts') {
            result[index] = day.exerciseBreakdown?.length || 0;
          } else {
            result[index] = Math.round(day.nutrition?.[type] || 0);
          }
        }
      });
      
      return result;
    };
    
    return {
      calories: calculateDailyData('calories'),
      protein: calculateDailyData('protein'),
      carbs: calculateDailyData('carbs'),
      fats: calculateDailyData('fats'),
      workouts: calculateDailyData('workouts')
    };
  }, [weeklyData]);
  
  // Calculate percentage changes for weekly summary
  const weeklyChanges = useMemo(() => {
    const calculateChange = (type: 'calories' | 'protein' | 'workouts' | 'water') => {
      if (weeklyData.length < 2) return 0;
      
      let currentValue = 0;
      let previousValue = 0;
      
      if (type === 'calories') {
        currentValue = dailyData.calories.reduce((sum, val) => sum + val, 0);
        // Simulate previous week value for now
        previousValue = currentValue * 0.96; // Assuming 4% increase from last week
      } else if (type === 'protein') {
        currentValue = dailyData.protein.reduce((sum, val) => sum + val, 0);
        previousValue = currentValue * 0.97; // Assuming 3% increase from last week
      } else if (type === 'workouts') {
        currentValue = dailyData.workouts.reduce((sum, val) => sum + val, 0);
        previousValue = currentValue + 1; // Assuming 1 less workout than last week
      } else {
        // Water is just a placeholder since we don't track it yet
        return 2;
      }
      
      if (previousValue === 0) return 0;
      
      return parseFloat(((currentValue - previousValue) / previousValue * 100).toFixed(1));
    };
    
    return {
      calories: calculateChange('calories'),
      protein: calculateChange('protein'),
      workouts: calculateChange('workouts'),
      water: calculateChange('water')
    };
  }, [weeklyData, dailyData]);
  
  // Helper function to get workout distribution
  const workoutDistribution = useMemo(() => {
    interface WorkoutTypeData {
      type: string;
      count: number;
      percentage: number;
    }
    
    if (!weeklyData || weeklyData.length === 0) {
      return [
        { type: 'Cardio', count: 0, percentage: 33 },
        { type: 'Strength', count: 0, percentage: 33 },
        { type: 'Other', count: 0, percentage: 34 }
      ];
    }
    
    // Count exercises by type
    const exerciseCounts: {[key: string]: number} = {};
    let totalExercises = 0;
    
    weeklyData.forEach(day => {
      day.exerciseBreakdown?.forEach((exercise: any) => {
        const type = exercise.category || exercise.type || 'Other';
        exerciseCounts[type] = (exerciseCounts[type] || 0) + 1;
        totalExercises++;
      });
    });
    
    // If no exercises recorded, return default
    if (totalExercises === 0) {
      return [
        { type: 'Cardio', count: 0, percentage: 33 },
        { type: 'Strength', count: 0, percentage: 33 },
        { type: 'Other', count: 0, percentage: 34 }
      ];
    }
    
    // Convert to array and calculate percentages
    const result = Object.entries(exerciseCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalExercises) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);  // Only show top 3
    
    // If less than 3 types, add dummy data
    while (result.length < 3) {
      result.push({ 
        type: result.length === 0 ? 'Cardio' : result.length === 1 ? 'Strength' : 'Other', 
        count: 0, 
        percentage: 0 
      });
    }
    
    return result;
  }, [weeklyData]);
  
  // Helper function to get workout color
  const getWorkoutColor = useCallback((type: string): string => {
    const colors: {[key: string]: string} = {
      'Cardio': '#FF5733',
      'Running': '#FF5733',
      'Cycling': '#FF7F50',
      'Swimming': '#4169E1',
      'Strength': '#8A2BE2',
      'Weights': '#8A2BE2',
      'Yoga': '#3CB371',
      'HIIT': '#FF4500',
      'Pilates': '#20B2AA',
      'Other': '#1E90FF'
    };
    
    return colors[type] || '#1E90FF';
  }, []);
  
  // Helper function to get most frequent exercise
  const mostFrequentExercise = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) {
      return '';
    }
    
    const exerciseCounts: {[key: string]: number} = {};
    
    weeklyData.forEach(day => {
      day.exerciseBreakdown?.forEach((exercise: any) => {
        const name = exercise.name || exercise.type || 'Unknown';
        exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
      });
    });
    
    if (Object.keys(exerciseCounts).length === 0) {
      return '';
    }
    
    const sortedExercises = Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1]);
    
    return sortedExercises[0][0];
  }, [weeklyData]);
  
  // Helper function to get calorie balance history
  const calorieHistory = useMemo(() => {
    interface CalorieBalanceData {
      day: string;
      intake: number;
      burned: number;
      balance: number;
    }
    
    if (!weeklyData || weeklyData.length === 0) {
      // Return default data if no weekly data
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days.map(day => ({
        day,
        intake: 0,
        burned: 0,
        balance: 0
      }));
    }
    
    // Use Monday-Sunday order for display
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return weeklyData.map((day, index) => {
      const dayName = dayNames[index];
      
      const intake = day.totalCaloriesIn || 0;
      const burned = (day.totalCaloriesOut || 0) + (day.tdee || 0);
      const balance = intake - burned;
      
      return {
        day: dayName,
        intake,
        burned,
        balance: Math.round(balance)
      };
    });
  }, [weeklyData]);
  
  // Calculate average daily nutrient intakes
  const nutrientAverages = useMemo(() => {
    if (weeklyData.length === 0) return { carbs: 0, protein: 0, fats: 0 };
    
    const totalCarbs = weeklyData.reduce((sum, day) => sum + (day.nutrition?.carbs || 0), 0);
    const totalProtein = weeklyData.reduce((sum, day) => sum + (day.nutrition?.protein || 0), 0);
    const totalFats = weeklyData.reduce((sum, day) => sum + (day.nutrition?.fats || 0), 0);
    
    return {
      carbs: Math.round(totalCarbs / weeklyData.length),
      protein: Math.round(totalProtein / weeklyData.length),
      fats: Math.round(totalFats / weeklyData.length)
    };
  }, [weeklyData]);
  
  // Get percentage for progress bars
  const getProgressPercentage = useCallback((nutrient: 'carbs' | 'protein' | 'fats') => {
    const targets = {
      carbs: 240,
      protein: 140,
      fats: 30
    };
    
    const value = nutrientAverages[nutrient];
    const target = targets[nutrient];
    
    return Math.min(100, Math.round((value / target) * 100));
  }, [nutrientAverages]);
  
  // Render loading state with partial data
  if (loading && !refreshing && loadingStates.summary && loadingStates.profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
        <Text className="mt-4 text-gray-600">Loading your fitness stats...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-800">Stats</Text>
        <Text className="text-gray-500">Your fitness analytics and progress</Text>
      </View>
      
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#f97316"]}
            tintColor="#f97316"
          />
        }
      >
        {/* Weekly Summary Card */}
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Weekly Summary</Text>
          
          {loadingStates.summary ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <>
              <View className="flex-row justify-between mb-4">
                <View className="items-center">
                  <Text className="text-gray-500 text-xs">Calories</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dailyData.calories.reduce((sum, val) => sum + val, 0).toLocaleString()}
                  </Text>
                  <Text className={`text-xs ${weeklyChanges.calories >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {weeklyChanges.calories >= 0 ? '+' : ''}{weeklyChanges.calories}%
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text className="text-gray-500 text-xs">Protein</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dailyData.protein.reduce((sum, val) => sum + val, 0)}g
                  </Text>
                  <Text className={`text-xs ${weeklyChanges.protein >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {weeklyChanges.protein >= 0 ? '+' : ''}{weeklyChanges.protein}%
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text className="text-gray-500 text-xs">Workouts</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dailyData.workouts.reduce((sum, val) => sum + val, 0)}
                  </Text>
                  <Text className={`text-xs ${weeklyChanges.workouts >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {weeklyChanges.workouts >= 0 ? '+' : ''}{weeklyChanges.workouts}
                  </Text>
                </View>
                
                <View className="items-center">
                  <Text className="text-gray-500 text-xs">Water</Text>
                  <Text className="text-lg font-bold text-gray-800">38L</Text>
                  <Text className="text-xs text-green-500">+2L</Text>
                </View>
              </View>
              
              {/* Calorie chart */}
              <View className="h-32 flex-row items-end justify-between mt-4 mb-2">
                {dailyData.calories.map((value, index) => {
                  const maxCalories = Math.max(...dailyData.calories);
                  const percentage = maxCalories > 0 ? (value / maxCalories) * 100 : 0;
                  
                  return (
                    <View key={index} className="flex-1 mx-1">
                      <View 
                        className="bg-primary rounded-t-md" 
                        style={{ height: `${Math.max(5, percentage)}%` }}
                      />
                    </View>
                  );
                })}
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
            </>
          )}
        </View>
        
        {/* Workout Distribution */}
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Workout Distribution</Text>
          
          {loadingStates.summary ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <>
              <View className="flex-row justify-around items-center py-4">
                {workoutDistribution.map((item, index) => (
                  <View key={index} className="items-center">
                    <View 
                      style={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: 30, 
                        backgroundColor: getWorkoutColor(item.type),
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text className="text-white font-bold">{item.percentage}%</Text>
                    </View>
                    <Text className="text-xs text-gray-600 mt-2">{item.type}</Text>
                  </View>
                ))}
              </View>
              
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="font-medium text-gray-800 mb-2">Most Frequent Exercise</Text>
                <Text className="text-gray-600">
                  {mostFrequentExercise || "No workouts recorded"}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Calorie Balance History */}
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-4">Calorie Balance</Text>
          
          {loadingStates.summary ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <>
              <View className="space-y-3">
                {calorieHistory.map((day, index) => (
                  <View key={index}>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">{day.day}</Text>
                      <Text 
                        className={`font-medium ${day.balance >= 0 ? 'text-red-500' : 'text-green-500'}`}
                      >
                        {day.balance >= 0 ? '+' : ''}{day.balance} cal
                      </Text>
                    </View>
                    <View className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                      <View 
                        className={`h-full rounded-full ${day.balance >= 0 ? 'bg-orange-500' : 'bg-green-500'}`} 
                        style={{ 
                          width: `${Math.min(100, Math.abs(day.balance) / 20)}%`, 
                          marginLeft: day.balance < 0 ? 0 : '50%'
                        }} 
                      />
                    </View>
                  </View>
                ))}
              </View>
              
              <View className="mt-4 flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
                  <Text className="text-xs text-gray-600">Calorie Deficit</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-orange-500 mr-1" />
                  <Text className="text-xs text-gray-600">Calorie Surplus</Text>
                </View>
              </View>
            </>
          )}
        </View>
        
        {/* Nutritional Insights */}
        <View className="bg-white rounded-lg p-4 shadow mb-16">
          <Text className="text-xl font-bold text-gray-800 mb-4">Nutritional Insights</Text>
          
          {loadingStates.summary ? (
            <ActivityIndicator size="small" color="#f97316" />
          ) : (
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Protein Intake</Text>
                <Text className="text-gray-900 font-medium">{nutrientAverages.protein}g/day</Text>
              </View>
              
              <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${getProgressPercentage('protein')}%` }} 
                />
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Carbs Intake</Text>
                <Text className="text-gray-900 font-medium">{nutrientAverages.carbs}g/day</Text>
              </View>
              
              <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${getProgressPercentage('carbs')}%` }} 
                />
              </View>
              
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-700">Fats Intake</Text>
                <Text className="text-gray-900 font-medium">{nutrientAverages.fats}g/day</Text>
              </View>
              
              <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-orange-500 rounded-full" 
                  style={{ width: `${getProgressPercentage('fats')}%` }} 
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}