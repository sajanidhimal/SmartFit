import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getExercises } from '@/app/utils/database_service/exercise_functions';
import { auth } from '@/app/firebase';
import { logExercise } from '@/app/utils/database_service/exercise_tracking_functions';
import { Timestamp } from 'firebase/firestore';

// Match the interface with the database structure
interface ExerciseData {
  id?: string;
  name: string;
  caloriesPerMinute: number;
  image?: string | null;
  instructions?: string | null;
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTitle, setCategoryTitle] = useState('');
  
  const categories = {
    'fullbody': 'Full Body',
    'cardio': 'Cardio',
    'strength': 'Strength',
    'yoga': 'Yoga',
    'hiit': 'HIIT',
    'sports': 'Sports'
  };

  useEffect(() => {
    fetchExercises();
    if (typeof id === 'string' && id in categories) {
      setCategoryTitle(categories[id as keyof typeof categories]);
    }
  }, [id]);

  const fetchExercises = async () => {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    const result = await getExercises(id);
    
    if (result.success && result.data) {
      setExercises(result.data);
    }
    
    setLoading(false);
  };
  
  const startExercise = async (exercise: ExerciseData) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    // For demo purposes, log a 30-minute exercise
    const duration = 30; // minutes
    const caloriesBurned = exercise.caloriesPerMinute * duration;
    
    try {
      await logExercise(userId, {
        type: 'gym_exercise',
        caloriesBurned,
        date: Timestamp.now(),
        category: categoryTitle,
        name: exercise.name,
        duration
      });
      
      // Navigate back to fitness screen
      router.back();
    } catch (error) {
      console.error('Error logging exercise:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 mb-16">
      <View className="p-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-gray-800">{categoryTitle}</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#f97316" className="flex-1" />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-gray-500">No exercises found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-lg overflow-hidden mb-4 shadow">
              {item.image && (
                <Image 
                  source={{ uri: item.image }} 
                  className="w-full h-40" 
                  resizeMode="cover"
                />
              )}
              <View className="p-4">
                <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
                <Text className="text-gray-600 mb-2">Calories: {item.caloriesPerMinute} / min</Text>
                
                {item.instructions && (
                  <View className="mb-4">
                    <Text className="text-sm text-gray-600">{item.instructions}</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={() => startExercise(item)}
                  className="bg-orange-500 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-medium">Start Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
} 