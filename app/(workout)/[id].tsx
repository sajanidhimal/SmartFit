import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Timestamp } from 'firebase/firestore';

interface WorkoutData {
  id?: string;
  type: string;
  caloriesBurned: number;
  date: Timestamp;
  category?: string;
  name?: string;
  duration?: number;
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkoutDetail();
  }, [id]);

  const fetchWorkoutDetail = async () => {
    if (!id || typeof id !== 'string') return;
    
    const userId = auth.currentUser?.uid;
    if (!userId) {
      router.replace('/(app)/home');
      return;
    }
    
    setLoading(true);
    
    try {
      const workoutDoc = await getDoc(doc(db, 'userProfiles', userId, 'calorieOutgoing', id));
      
      if (workoutDoc.exists()) {
        const data = workoutDoc.data() as WorkoutData;
        setWorkout({
          id: workoutDoc.id,
          ...data
        });
      } else {
        // Workout not found
        alert('Workout not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 mb-16">
      <View className="p-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-gray-800">Workout Details</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#f97316" className="flex-1" />
      ) : workout ? (
        <View className="p-4">
          <View className="bg-white rounded-lg p-5 shadow">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              {workout.name || workout.category || workout.type}
            </Text>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Date:</Text>
              <Text className="font-medium text-gray-800">
                {workout.date ? formatDate(workout.date) : 'N/A'}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Duration:</Text>
              <Text className="font-medium text-gray-800">
                {workout.duration ? `${workout.duration} minutes` : 'N/A'}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Calories Burned:</Text>
              <Text className="font-medium text-gray-800">
                {workout.caloriesBurned} kcal
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-600">Type:</Text>
              <Text className="font-medium text-gray-800">
                {workout.type}
              </Text>
            </View>
            
            {workout.category && (
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Category:</Text>
                <Text className="font-medium text-gray-800">
                  {workout.category}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Workout not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
} 