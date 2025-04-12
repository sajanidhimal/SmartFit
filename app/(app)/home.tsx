//home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularProgress from '../../components/CircularProgress';
import MacroCard from '../../components/MacroCard';
import WeekCalendar from '../../components/WeekCalendar';
import NutritionTracker from '../../components/NutritionDetail';
import { useFocusEffect } from 'expo-router';

// Import your Firebase functions
import { 
  getUserProfile, 
  UserProfile as BaseUserProfile
} from '../utils/database_service/profile_functions';
import { 
  getFoodIntakeByDate, 
  
} from '../utils/database_service/calorie_intake_functions';

import { 
  getExerciseByDate, 
  
} from '../utils/database_service/exercise_tracking_functions';

import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { seedDefaultExerciseDatabase, seedDefaultFoodDatabase } from '../utils/database_service/seed_data';
import { auth, db } from '../firebase';

// Extend the base UserProfile to include the fields used in our app
interface UserProfile extends BaseUserProfile {
  dailyCalorieGoal?: number;
  name?: string;
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // State for daily stats
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    calories: {
      eaten: 0,
      remaining: 0,
      burned: 0,
      total: 0
    },
    macros: {
      protein: { current: 0, goal: 0, unit: 'g' },
      fats: { current: 0, goal: 0, unit: 'g' },
      carbs: { current: 0, goal: 0, unit: 'g' }
    },
    water: {
      current: 0,
      goal: 8,
      unit: 'Liters'
    }
  });

  // State for week days
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [weekDays, setWeekDays] = useState<Array<{day: string, date: number, active: boolean, fullDate: Date}>>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Load user data and initialize the app
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // In a real app, you would get this from auth
        const currentUserId = auth.currentUser?.uid; 
        if (!currentUserId) {
          console.error('User not logged in');
          return;
        }
        setUserId(currentUserId);
        console.log('Current User ID:', currentUserId);

        // Get user profile
        const profileResult = await getUserProfile(currentUserId);
        if (profileResult.success) {
          const profileData = profileResult.data as UserProfile;
          setUserProfile(profileData);
          
          // Use profile data, including directly using dailyCalorieGoal if available
          if (profileData?.dailyCalorieGoal) {
            const calorieGoal = Number(profileData.dailyCalorieGoal);
            
            setDailyStats(prev => ({
              ...prev,
              calories: {
                ...prev.calories,
                total: calorieGoal,
                remaining: calorieGoal
              },
              macros: {
                protein: { current: 0, goal: Math.round(calorieGoal * 0.3 / 4), unit: 'g' }, // 30% of calories from protein
                fats: { current: 0, goal: Math.round(calorieGoal * 0.25 / 9), unit: 'g' },   // 25% of calories from fat
                carbs: { current: 0, goal: Math.round(calorieGoal * 0.45 / 4), unit: 'g' }  // 45% of calories from carbs
              }
            }));
          } else {
            // Fallback to calculating BMR and TDEE
            const gender = profileData?.gender || '';
            const weight = Number(profileData?.weight) || 70;
            const height = Number(profileData?.height) || 170;
            // Handle different age representations based on how it was stored
            let age = 30; // Default
            if (profileData?.age) {
              age = typeof profileData.age === 'number' ? profileData.age : 
                    profileData.age ? Number(profileData.age) : 30;
            }
            
            const bmr = calculateBMR(
              gender,
              weight,
              height,
              age
            );
            
            // Handle activity level with case-insensitive comparison
            let activityLevel = 'moderate';
            if (profileData?.activityLevel) {
              activityLevel = profileData.activityLevel.toLowerCase();
            }
            
            const tdee = calculateTDEE(bmr, activityLevel);
            
            setDailyStats(prev => ({
              ...prev,
              calories: {
                ...prev.calories,
                total: tdee,
                remaining: tdee
              },
              macros: {
                protein: { current: 0, goal: Math.round(tdee * 0.3 / 4), unit: 'g' },
                fats: { current: 0, goal: Math.round(tdee * 0.25 / 9), unit: 'g' },
                carbs: { current: 0, goal: Math.round(tdee * 0.45 / 4), unit: 'g' }
              }
            }));
          }
        }
        
        // Initialize week days
        initializeWeekDays();
        
        // Load data for the current day
        await loadDailyData(new Date());
        
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
        setDataLoaded(true);  // Mark initial data as loaded
      }
    };
    
    loadUserData();
  }, []);

  // Calculate Basal Metabolic Rate
  const calculateBMR = (gender: string, weight: number, height: number, age: number): number => {
    if (gender.toLowerCase() === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  // Calculate Total Daily Energy Expenditure
  const calculateTDEE = (bmr: number, activityLevel: string): number => {
    const activityMultipliers: {[key: string]: number} = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very active': 1.9
    };
    
    // Normalize activity level - handle both formats (with spaces or underscores)
    const normalizedActivityLevel = activityLevel.toLowerCase().replace('_', ' ');
    const multiplier = activityMultipliers[normalizedActivityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  };

  // Initialize the week days array
  const initializeWeekDays = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 6 is Saturday
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get dates for the current week (Sunday to Saturday)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - day + i);
      
      days.push({
        day: dayNames[i],
        date: date.getDate(),
        active: i === day, // Today is active
        fullDate: date
      });
    }
    
    setWeekDays(days);
  };

  // Refresh data when screen comes into focus, but only after initial load
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      // Skip during initial load to prevent duplicate loading
      if (dataLoaded && userId && !isLoading) {
        console.log('Home screen focused, reloading data...');
        
        const refreshData = async () => {
          try {
            await loadDailyData(selectedDate);
          } catch (error) {
            console.error("Error in focus effect refresh:", error);
          }
        };
        
        // Only execute if this component is still mounted
        if (isActive) {
          refreshData();
        }
      }
      
      return () => {
        // Mark as inactive when the screen loses focus
        isActive = false;
      };
    }, [userId, selectedDate, dataLoaded, isLoading])
  );

  // Load daily nutrition and exercise data
  const loadDailyData = async (date: Date) => {
    if (!userId) return;
    
    // Detect if this is a background refresh
    const backgroundRefresh = dataLoaded;
    
    try {
      // Only show loading indicator for initial load and user-initiated actions
      if (!backgroundRefresh) {
        setIsLoading(true);
      }
      
      // Create start and end of day timestamps
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const startTimestamp = Timestamp.fromDate(startOfDay);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      // Get food intake for the day
      const foodIntakeResult = await getFoodIntakeByDate(userId, startTimestamp, endTimestamp);
      
      // Get exercise data for the day
      const exerciseResult = await getExerciseByDate(userId, startTimestamp, endTimestamp);
      
      // Calculate nutrition totals
      let totalCaloriesEaten = 0;
      let totalProtein = 0;
      let totalFats = 0;
      let totalCarbs = 0;
      
      if (foodIntakeResult.success && foodIntakeResult.data) {
        console.log('Food intake data loaded:', foodIntakeResult.data.length, 'items');
        foodIntakeResult.data.forEach(item => {
          // Ensure values are treated as numbers
          const calories = typeof item.calories === 'number' ? item.calories : Number(item.calories) || 0;
          const protein = typeof item.protein === 'number' ? item.protein : Number(item.protein) || 0;
          const fats = typeof item.fats === 'number' ? item.fats : Number(item.fats) || 0;
          const carbs = typeof item.carbs === 'number' ? item.carbs : Number(item.carbs) || 0;
          
          totalCaloriesEaten += calories;
          totalProtein += protein;
          totalFats += fats;
          totalCarbs += carbs;
          
          // Only log details during manual refresh for debugging
          if (!backgroundRefresh) {
            console.log(`Food item: ${item.name}, Calories: ${calories}`);
          }
        });
      }
      
      // Calculate calories burned
      let totalCaloriesBurned = 0;
      if (exerciseResult.success && exerciseResult.data) {
        exerciseResult.data.forEach(item => {
          const caloriesBurned = typeof item.caloriesBurned === 'number' ? 
                                  item.caloriesBurned : Number(item.caloriesBurned) || 0;
          totalCaloriesBurned += caloriesBurned;
        });
      }
      
      if (!backgroundRefresh) {
        console.log('Total calories eaten:', totalCaloriesEaten);
        console.log('Total calories burned:', totalCaloriesBurned);
      }
      
      // Update daily stats
      setDailyStats(prev => {
        const caloriesRemaining = prev.calories.total - totalCaloriesEaten + totalCaloriesBurned;
        
        return {
          ...prev,
          calories: {
            eaten: Math.round(totalCaloriesEaten),
            burned: Math.round(totalCaloriesBurned),
            remaining: Math.round(caloriesRemaining),
            total: prev.calories.total
          },
          macros: {
            protein: { ...prev.macros.protein, current: Math.round(totalProtein) },
            fats: { ...prev.macros.fats, current: Math.round(totalFats) },
            carbs: { ...prev.macros.carbs, current: Math.round(totalCarbs) }
          }
        };
      });
      
    } catch (error) {
      console.error("Error loading daily data:", error);
    } finally {
      // Always ensure loading state is updated properly
      if (!backgroundRefresh) {
        setIsLoading(false);
      }
    }
  };

  // Handle week day selection
  const selectDay = (index: number) => {
    const updatedWeekDays = weekDays.map((day, i) => ({
      ...day,
      active: i === index
    }));
    
    setWeekDays(updatedWeekDays);
    setSelectedDate(weekDays[index].fullDate);
    loadDailyData(weekDays[index].fullDate);
  };

  // Handle water tracking
  const addWater = () => {
    setDailyStats(prev => ({
      ...prev,
      water: {
        ...prev.water,
        current: Math.min(prev.water.current + 1, prev.water.goal)
      }
    }));
    
    // In a real app, you would save this to Firebase
    // saveWaterIntake(userId, selectedDate, dailyStats.water.current + 1);
  };

  // Navigate to previous week
  const handlePrevWeek = () => {
    const firstDayOfCurrentWeek = weekDays[0].fullDate;
    const prevWeekStart = new Date(firstDayOfCurrentWeek);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    
    const newWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(prevWeekStart);
      date.setDate(prevWeekStart.getDate() + i);
      
      newWeekDays.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        date: date.getDate(),
        active: i === 0, // Select first day by default
        fullDate: date
      });
    }
    
    setWeekDays(newWeekDays);
    setSelectedDate(newWeekDays[0].fullDate);
    loadDailyData(newWeekDays[0].fullDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const firstDayOfCurrentWeek = weekDays[0].fullDate;
    const nextWeekStart = new Date(firstDayOfCurrentWeek);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    const newWeekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextWeekStart);
      date.setDate(nextWeekStart.getDate() + i);
      
      newWeekDays.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        date: date.getDate(),
        active: i === 0, // Select first day by default
        fullDate: date
      });
    }
    
    setWeekDays(newWeekDays);
    setSelectedDate(newWeekDays[0].fullDate);
    loadDailyData(newWeekDays[0].fullDate);
  };

  // Make the NutritionTracker share data with parent component
  const handleNutritionDataUpdate = () => {
    // Reload data when child component indicates data has changed
    loadDailyData(selectedDate);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 w-full items-center justify-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 w-full">
      <ScrollView className="flex-1 px-4 mb-16 w-full">
        {/* Header */}
        <View className="flex-row justify-between items-center py-6 w-full">
          <View>
            <Text className="text-lg text-gray-500">Welcome</Text>
            <Text className="text-3xl font-bold text-gray-800">
              {/* Friendly greeting based on gender if name is not available */}
              {userProfile?.name || (userProfile?.gender === 'Male' || userProfile?.gender?.toLowerCase() === 'male' ? 'Sir' : 
               userProfile?.gender === 'Female' || userProfile?.gender?.toLowerCase() === 'female' ? 'Ma\'am' : 'User')}!
            </Text>
          </View>
          <TouchableOpacity 
            // onPress={() => router.push('/profile')}
            className="w-10 h-10 bg-gray-300 rounded-full items-center justify-center"
          >
            <Ionicons name="person" size={24} color="#777" />
          </TouchableOpacity>
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
            <TouchableOpacity 
  className="flex-1 justify-center space-y-4"
  onPress={() => router.push('/(food)')}
>
            <View  className="flex-1 justify-center space-y-4">
              <View>
                <Text className="text-gray-500">Eaten</Text>
                <Text className="text-xl">
                  {dailyStats.calories.eaten} <Text className="text-gray-400 text-sm">kcal</Text>
                </Text>
              </View>
              
              <View>
                <Text className="text-gray-500">Remaining</Text>
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
            </TouchableOpacity 
            >
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
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
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
            className="w-12 h-12 bg-blue-500 rounded-lg items-center justify-center"
             onPress={addWater}
            
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
       
        <NutritionTracker 
          userId={userId!} 
          selectedDate={selectedDate} 
          onDataUpdate={handleNutritionDataUpdate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
