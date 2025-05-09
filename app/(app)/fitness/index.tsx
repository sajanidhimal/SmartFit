//fiteness/index.ts
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/app/firebase';
import { getExercises, getExerciseCategories, CategoryData } from '@/app/utils/database_service/exercise_functions';
import { getExerciseByDate } from '@/app/utils/database_service/exercise_tracking_functions';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

// Define types
interface ExerciseData {
  id?: string;
  type: string;
  caloriesBurned: number;
  date: Timestamp;
  category?: string;
  name?: string;
  duration?: number;
}

interface CategoryExercises {
  [key: string]: any[];
}

export default function FitnessScreen() {
  const router = useRouter();
  const [userWorkouts, setUserWorkouts] = useState<ExerciseData[]>([]);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [totalWorkoutMinutes, setTotalWorkoutMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<CategoryExercises>({});
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchUserWorkouts();
    fetchCategories();
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserWorkouts();
      await fetchCategories();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const fetchUserWorkouts = async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    // Get workouts from the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const result = await getExerciseByDate(
      userId, 
      Timestamp.fromDate(thirtyDaysAgo),
      Timestamp.fromDate(now)
    );
    
    if (result.success && result.data) {
      setUserWorkouts(result.data);
      
      // Calculate total calories and minutes
      let totalCals = 0;
      let totalMins = 0;
      
      result.data.forEach(workout => {
        totalCals += workout.caloriesBurned || 0;
        totalMins += workout.duration || 0;
      });
      
      setTotalCaloriesBurned(totalCals);
      setTotalWorkoutMinutes(totalMins);
    }
    
    setLoading(false);
  };
  
  const fetchCategories = async () => {
    try {
      // Get all available exercise categories from database
      const result = await getExerciseCategories();
      if (result.success && result.data) {
        setCategories(result.data);
        
        // Fetch exercises for each category
        fetchExercisesByCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  
  const fetchExercisesByCategories = async (categoryList: CategoryData[]) => {
    // Fetch exercises for each category
    const exercisesByCategory: CategoryExercises = {};
    
    for (const category of categoryList) {
      const result = await getExercises(category.id);
      if (result.success && result.data) {
        exercisesByCategory[category.id] = result.data;
      }
    }
    
    setExercises(exercisesByCategory);
  };
  
  const navigateToCategory = (category: string) => {
    router.push(`/fitness/category/${category}`);
  };
  
  const navigateToWorkoutDetail = (workoutId: string) => {
    router.push(`/fitness/workout/${workoutId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 mb-16">
      <View className="p-4">
        <Text className="text-3xl font-bold text-gray-800 uppercase">ready to</Text>
        <Text className="text-3xl font-bold text-orange-400 uppercase">workout</Text>
      </View>
      
      <View className="p-4">
        <View className="flex-row justify-between mb-6 gap-4">
          <View className="flex-1 items-center bg-white rounded-lg p-4">
            <Text className="text-3xl font-bold text-gray-800">{userWorkouts.length}</Text>
            <Text className="text-xl font-bold text-orange-500">Workouts</Text>
          </View>
          <View className="flex-1 items-center bg-white rounded-lg p-4">
            <Text className="text-3xl font-bold text-gray-800">{totalCaloriesBurned.toFixed(0)}</Text>
            <Text className="text-xl font-bold text-orange-500">Kcals</Text>
          </View>
          <View className="flex-1 items-center bg-white rounded-lg p-4">
            <Text className="text-3xl font-bold text-gray-800">{totalWorkoutMinutes.toFixed(0)}</Text>
            <Text className="text-xl font-bold text-orange-500">Minutes</Text>
          </View>
        </View>
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
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#f97316" />
        ) : (
          <>
            {/* Recent workouts carousel */}
            <Text className="text-xl font-bold text-gray-800 mb-2">Recent Workouts</Text>
            {userWorkouts.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-[150px] mb-4">
                {userWorkouts.map((workout, idx) => (
                  <TouchableOpacity 
                    key={workout.id || idx} 
                    className="w-72 mr-4 bg-white rounded-lg overflow-hidden"
                    onPress={() => workout.id && navigateToWorkoutDetail(workout.id)}
                  >
                    <View className="p-4 flex-1">
                      <Text className="text-lg font-bold text-gray-800">{workout.name || workout.type}</Text>
                      <Text className="text-orange-500">{workout.caloriesBurned} kcal • {workout.duration || 0} min</Text>
                      <Text className="text-gray-500">
                        {workout.date ? new Date(workout.date.toDate()).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="h-[150px] mb-4 bg-white rounded-lg items-center justify-center">
                <Text className="text-gray-500">No recent workouts</Text>
              </View>
            )}

            {/* Exercise categories */}
            <View className="bg-white rounded-lg p-4 shadow mb-4">
              <Text className="text-4xl font-bold text-gray-800 mb-4">Exercise</Text>
              
              <View className="flex-row flex-wrap justify-between">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <TouchableOpacity 
                      key={category.id} 
                      className="w-[48%] h-40 mb-4 rounded-lg overflow-hidden"
                      onPress={() => navigateToCategory(category.id)}
                    >
                      <Image
                        source={{ uri: category.image || `https://picsum.photos/200/300?random=${index+1}` }}
                        className="absolute w-full h-full"
                      />
                      <View className="w-full h-full bg-black/30 items-center justify-center">
                        <Ionicons name={category.icon as any || 'fitness-outline'} size={28} color="white" />
                        <Text className="text-white font-medium mt-2">{category.name}</Text>
                        <Text className="text-white text-xs mt-1">
                          {exercises[category.id] ? `${exercises[category.id].length} exercises` : 'Loading...'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="items-center justify-center py-8 w-full">
                    <Text className="text-gray-500">No exercise categories found</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
