import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Modal,
  TextInput,
  Animated,
  Easing
} from 'react-native';
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
  
  // Timer and workout state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseData | null>(null);
  const [duration, setDuration] = useState("30");
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // For category title display
  const categories: {[key: string]: string} = {
    'fullbody': 'Full Body',
    'cardio': 'Cardio',
    'strength_training': 'Strength Training',
    'bodyweight': 'Bodyweight',
    'yoga': 'Yoga',
    'hiit': 'HIIT',
    'sports': 'Sports',
    'camera_detection': 'Camera Exercises'
  };

  useEffect(() => {
    fetchExercises();
    if (typeof id === 'string') {
      setCategoryTitle(categories[id] || id);
    }
  }, [id]);
  
  useEffect(() => {
    // Cleanup timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle timer
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerActive(false);
            setWorkoutComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();
    } else if (!timerActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop animation when timer stops
      spinValue.stopAnimation();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);
  
  // Create the spinning animation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const fetchExercises = async () => {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    const result = await getExercises(id);
    
    if (result.success && result.data) {
      setExercises(result.data);
    }
    
    setLoading(false);
  };
  
  const openTimerModal = (exercise: ExerciseData) => {
    setSelectedExercise(exercise);
    setDuration("30"); // Default to 30 minutes
    setWorkoutComplete(false);
    setModalVisible(true);
  };
  
  const startTimer = () => {
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert("Please enter a valid duration");
      return;
    }
    
    setTimeRemaining(durationMinutes * 60); // Convert minutes to seconds
    setTimerActive(true);
  };
  
  const stopTimer = () => {
    setTimerActive(false);
  };
  
  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(parseInt(duration) * 60);
  };
  
  const completeWorkout = async () => {
    if (!selectedExercise) return;
    
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert("Please enter a valid duration");
      return;
    }
    
    // Calculate calories burned based on actual time spent
    const actualDurationMinutes = timerActive ? 
      durationMinutes - Math.ceil(timeRemaining / 60) : // Use elapsed time if timer is still running
      durationMinutes; // Use full duration if completed or manually stopped
    
    const caloriesPerMin = typeof selectedExercise.caloriesPerMinute === 'number' ? 
      selectedExercise.caloriesPerMinute : 0;
    const caloriesBurned = caloriesPerMin * actualDurationMinutes;
    
    try {
      await logExercise(userId, {
        type: 'gym_exercise',
        caloriesBurned,
        date: Timestamp.now(),
        category: categoryTitle,
        name: selectedExercise.name,
        duration: actualDurationMinutes
      });
      
      // Close modal and show success message
      setModalVisible(false);
      alert(`Great job! You burned ${Math.round(caloriesBurned)} calories.`);
      
    } catch (error) {
      console.error('Error logging exercise:', error);
      alert('Failed to save your workout. Please try again.');
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          keyExtractor={(item) => item.id || item.name}
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
                  onPress={() => openTimerModal(item)}
                  className="bg-orange-500 py-3 rounded-lg items-center"
                >
                  <Text className="text-white font-medium">Start Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      
      {/* Timer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!timerActive) {
            setModalVisible(false);
          } else {
            alert("Please stop the timer before closing");
          }
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-[90%] rounded-xl p-6 shadow-lg">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-2xl font-bold text-gray-800">
                {selectedExercise?.name}
              </Text>
              
              {!timerActive && (
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  disabled={timerActive}
                >
                  <Ionicons name="close" size={24} color="#777" />
                </TouchableOpacity>
              )}
            </View>
            
            {!timerActive && !workoutComplete ? (
              <>
                <Text className="text-gray-600 mb-3">How many minutes will you exercise?</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-lg mb-4"
                  keyboardType="numeric"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="Enter duration in minutes"
                />
                
                <TouchableOpacity 
                  onPress={startTimer}
                  className="bg-orange-500 py-4 rounded-lg items-center mb-2"
                >
                  <Text className="text-white font-bold text-lg">Start Timer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="items-center">
                {timerActive ? (
                  <>
                    <Animated.View 
                      style={{ transform: [{ rotate: spin }] }}
                      className="mb-4"
                    >
                      <Ionicons name="fitness" size={64} color="#f97316" />
                    </Animated.View>
                    
                    <Text className="text-5xl font-bold mb-5 text-gray-800">
                      {formatTime(timeRemaining)}
                    </Text>
                    
                    <View className="flex-row justify-around w-full mb-5">
                      <TouchableOpacity 
                        onPress={stopTimer}
                        className="bg-red-500 px-5 py-3 rounded-lg items-center"
                      >
                        <Text className="text-white font-bold">Stop</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={resetTimer}
                        className="bg-blue-500 px-5 py-3 rounded-lg items-center"
                      >
                        <Text className="text-white font-bold">Reset</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <Text className="text-gray-600 text-center">
                      Keep going! You're doing great!
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={64} color="green" className="mb-4" />
                    <Text className="text-2xl font-bold text-center mb-4 text-gray-800">
                      {workoutComplete ? "Workout Complete!" : "Workout Paused"}
                    </Text>
                    
                    <View className="flex-row justify-around w-full mb-5">
                      {!workoutComplete && (
                        <TouchableOpacity 
                          onPress={() => setTimerActive(true)}
                          className="bg-green-500 px-5 py-3 rounded-lg items-center"
                        >
                          <Text className="text-white font-bold">Resume</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        onPress={completeWorkout}
                        className="bg-orange-500 px-5 py-3 rounded-lg items-center"
                      >
                        <Text className="text-white font-bold">Save Workout</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <Text className="text-gray-600 text-center">
                      {workoutComplete 
                        ? `You've burned approximately ${Math.round((selectedExercise?.caloriesPerMinute || 0) * parseInt(duration || "0"))} calories!` 
                        : "You can resume your workout or save your progress."
                      }
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
} 