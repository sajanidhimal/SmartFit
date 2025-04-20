//home.tsx
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import CircularProgress from '../../components/CircularProgress';
import MacroCard from '../../components/MacroCard';
import WeekCalendar from '../../components/WeekCalendar';
import NutritionTracker from '../../components/NutritionDetail';
import { useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

import { addDoc, collection, getDocs, Timestamp, query, where, orderBy, limit, runTransaction, doc, getDoc, setDoc } from 'firebase/firestore';
import { seedDefaultExerciseDatabase, seedDefaultFoodDatabase } from '../utils/database_service/seed_data';
import { auth, db } from '../firebase';

// Constants
const WATER_STORAGE_KEY = 'daily_water_intake';
const MIN_RECOMMENDED_WATER = 4; // Minimum recommended water intake in liters

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

// Create a context to track when food is added
interface NutritionContextType {
  notifyFoodAdded: () => void;
}

export const NutritionContext = createContext<NutritionContextType>({
  notifyFoodAdded: () => {},
});

export default function HomeScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Helper to force NutritionTracker to reload when data changes
  const [nutritionKey, setNutritionKey] = useState(0);

  // Add a state to track if food was added
  const [foodAdded, setFoodAdded] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload data
      await loadUserData();
      await loadDailyData(selectedDate);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate]);

  // Load user data and initialize the app
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
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
      setDataLoaded(true);  // Mark initial data as loaded
    }
  };

  // Load water intake from Firestore on component mount
  useEffect(() => {
    if (userId) {
      loadWaterIntake();
    }
  }, [userId]);

  // Check water intake when the component mounts and when water stats change
  useEffect(() => {
    const checkWaterIntake = async () => {
      // Only check if the app has finished loading and we're in a stable state
      if (!isLoading && dataLoaded && userId) {
        // Get today's date string in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get the current time to only show alert during the later part of the day
        const currentHour = new Date().getHours();
        
        // Check if water intake is less than recommended and it's after 4 PM
        if (dailyStats.water.current < MIN_RECOMMENDED_WATER && currentHour >= 16) {
          // Check if we've already shown the alert today
          const alertRef = doc(db, "userProfiles", userId, "waterAlerts", today);
          const alertSnap = await getDoc(alertRef);
          
          if (!alertSnap.exists()) {
            Alert.alert(
              "Hydration Reminder",
              `You've only had ${dailyStats.water.current} ${dailyStats.water.unit} of water today. Consider drinking more to reach your goal of ${dailyStats.water.goal} ${dailyStats.water.unit}.`,
              [
                { text: "Dismiss", style: "cancel" },
                { 
                  text: "Add Water", 
                  onPress: addWater 
                }
              ]
            );
            
            // Save that we've shown the alert today
            await setDoc(alertRef, { 
              shown: true,
              timestamp: Timestamp.now()
            });
          }
        }
      }
    };
    
    checkWaterIntake();
  }, [isLoading, dataLoaded, dailyStats.water.current, userId]);

  // Load saved water intake from Firestore
  const loadWaterIntake = async () => {
    if (!userId) return;
    
    try {
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startTimestamp = Timestamp.fromDate(today);
      const endTimestamp = Timestamp.fromDate(tomorrow);
      
      // Query water intake documents for today
      const waterRef = collection(db, "userProfiles", userId, "waterIntake");
      const waterQuery = query(
        waterRef,
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<", endTimestamp)
      );
      
      const waterSnap = await getDocs(waterQuery);
      
      // Calculate total water intake for today
      let totalWater = 0;
      waterSnap.forEach(doc => {
        const data = doc.data();
        totalWater += data.amount || 0;
      });
      
      // Update the water intake in the daily stats
      setDailyStats(prev => ({
        ...prev,
        water: {
          ...prev.water,
          current: totalWater
        }
      }));
    } catch (error) {
      console.error('Error loading water intake from Firestore:', error);
    }
  };

  // Handle water tracking by updating Firestore
  const addWater = async () => {
    if (!userId) return;
    
    try {
      // Create a reference to the water intake collection
      const waterRef = collection(db, "userProfiles", userId, "waterIntake");
      
      // Add a new water intake document
      await addDoc(waterRef, {
        amount: 1, // 1 liter/glass at a time
        timestamp: Timestamp.now()
      });
      
      // Update the local state
      setDailyStats(prev => ({
        ...prev,
        water: {
          ...prev.water,
          current: prev.water.current + 1
        }
      }));
      
      return true;
    } catch (error) {
      console.error("Error adding water intake:", error);
      Alert.alert("Error", "Failed to update water intake");
      return false;
    }
  };

  // First load of data
  useEffect(() => {
    loadUserData().then(() => {
      loadDailyData(new Date());
    });
  }, []);

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Logout Error', 'An error occurred while logging out.');
            }
          }
        }
      ]
    );
  };
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
      
      // Only refresh data when the screen gets focus after initial load
      if (userId && !isLoading) {
        console.log('Screen in focus, reloading nutrition data...');
        
        const refreshData = async () => {
          try {
            await loadDailyData(selectedDate);
            // Also refresh water intake when returning to the screen
            if (userId) {
              loadWaterIntake();
            }
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
    }, [userId, selectedDate, isLoading])
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
      
      // Force NutritionTracker to re-render with new data
      setNutritionKey(prevKey => prevKey + 1);
      
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
  const handleNutritionDataUpdate = useCallback(() => {
    // Reload data when child component indicates data has changed
    console.log("Nutrition data updated, refreshing home screen data");
    loadDailyData(selectedDate);
    // Also mark food as added to ensure data is refreshed
    setFoodAdded(true);
  }, [selectedDate]);
  
  // Function to notify that food was added, can be called from other components
  const notifyFoodAdded = useCallback(() => {
    console.log("Food added notification received");
    setFoodAdded(true);
  }, []);
  
  // Create the context value
  const nutritionContextValue = {
    notifyFoodAdded
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 w-full items-center justify-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <NutritionContext.Provider value={nutritionContextValue}>
      <SafeAreaView className="flex-1 bg-gray-50" style={{ paddingBottom: 70 }}>
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="flex-row justify-between items-center px-5 py-4">
            <View>
              <Text className="text-2xl font-bold text-gray-800">
                Hello, {userProfile?.name || 'Fitness Enthusiast'}
              </Text>
              <Text className="text-gray-500">Let's check your progress</Text>
            </View>
            
            <View className="flex-row">
              {/* add profile icon */}
              <TouchableOpacity 
                className="w-10 h-10 rounded-full bg-white shadow-sm mr-2 items-center justify-center"
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="person-outline" size={20} color="#8A2BE2" />
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-10 h-10 rounded-full bg-white shadow-sm mr-2 items-center justify-center"
                onPress={() => router.push('/chat')}
              >
                <Ionicons name="chatbubbles" size={20} color="#8A2BE2" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="w-10 h-10 rounded-full bg-white shadow-sm items-center justify-center"
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF4500" />
              </TouchableOpacity>
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
              // onPress={()=>seedDefaultExerciseDatabase()}
            >
              <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
          </View>
         
          <NutritionTracker 
            userId={userId!} 
            selectedDate={selectedDate}
            onDataUpdate={handleNutritionDataUpdate}
            key={nutritionKey}
          />

          {/* Daily Summary */}
          <View className="mt-4 p-4 bg-white rounded-lg shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Quick Access</Text>
            <View className="flex-row justify-between mb-2">
              <TouchableOpacity 
                onPress={() => router.push('/fitness')}
                className="bg-primary/10 rounded-lg p-4 items-center w-[48%]"
              >
                <Ionicons name="barbell" size={24} color="#8A2BE2" />
                <Text className="font-medium text-gray-700 mt-2">Workouts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => router.push('/chat')}
                className="bg-primary/10 rounded-lg p-4 items-center w-[48%]"
              >
                <Ionicons name="chatbubbles" size={24} color="#8A2BE2" />
                <Text className="font-medium text-gray-700 mt-2">AI Coach</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </NutritionContext.Provider>
  );
}
