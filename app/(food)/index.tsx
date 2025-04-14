import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFoodIntakeByDate } from '../utils/database_service/calorie_intake_functions';
import { auth, db } from '../firebase';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import CircularProgress from '@/components/CircularProgress';

// Define types
interface FoodItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  image?: string | null;
  date: Timestamp;
}

export default function FoodTrackingScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner' | 'other'>('breakfast');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [calorieGoal, setCalorieGoal] = useState<number>(2000); // Default value
  const [macroTotals, setMacroTotals] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fats: 0
  });
  const [remainingCalories, setRemainingCalories] = useState<number>(2000);

  const tabs: ('breakfast' | 'lunch' | 'dinner' | 'other')[] = ['breakfast', 'lunch', 'dinner', 'other'];

  useEffect(() => {
    if (user) {
      loadUserCalorieGoal().then(() => {
        loadAllFoodItems();
      });
    }
  }, [user]);

  useEffect(() => {
    // Filter items by category when activeTab changes
    if (foodItems.length > 0) {
      calculateMacroTotals(foodItems);
    }
  }, [activeTab, foodItems]);

  // Add effect to update remaining calories when calorie goal changes
  useEffect(() => {
    if (macroTotals.calories !== undefined) {
      setRemainingCalories(calorieGoal - macroTotals.calories);
    }
  }, [calorieGoal, macroTotals.calories]);

  const loadUserCalorieGoal = async () => {
    if (!user) return;
    
    try {
      const userProfileRef = doc(db, "userProfiles", user.uid);
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        const userData = userProfileDoc.data();
        if (userData.dailyCalorieGoal) {
          const goal = Number(userData.dailyCalorieGoal);
          console.log("goal", goal);  
          setCalorieGoal(goal);
          setRemainingCalories(goal);
        }
      }
    } catch (error) {
      console.error('Error loading user calorie goal:', error);
    }
  };

  const loadAllFoodItems = async () => {
    setLoading(true);
    try {
      // Get today's date at 00:00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's date at 23:59:59
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const startTimestamp = Timestamp.fromDate(today);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      if (user) {
        const result = await getFoodIntakeByDate(user.uid, startTimestamp, endTimestamp);
        
        if (result.success && result.data) {
          const allItems = result.data as FoodItem[];
          setFoodItems(allItems);
          calculateMacroTotals(allItems);
        } else {
          console.error('Failed to load food items');
          setFoodItems([]);
          setMacroTotals({ calories: 0, carbs: 0, protein: 0, fats: 0 });
          setRemainingCalories(calorieGoal);
        }
      }
    } catch (error) {
      console.error('Error loading food items:', error);
      setFoodItems([]);
      setRemainingCalories(calorieGoal);
    } finally {
      setLoading(false);
    }
  };

  const calculateMacroTotals = (items: FoodItem[]) => {
    // Calculate totals for all food items, regardless of category
    const totals = items.reduce((acc, item) => {
      return {
        calories: acc.calories + Number(item.calories || 0),
        carbs: acc.carbs + Number(item.carbs || 0),
        protein: acc.protein + Number(item.protein || 0),
        fats: acc.fats + Number(item.fats || 0)
      };
    }, { calories: 0, carbs: 0, protein: 0, fats: 0 });
    
    setMacroTotals(totals);
    
    // This will be automatically updated by the useEffect that watches calorieGoal and macroTotals.calories
  };

  const getFoodImage = (name: string): string => {
    // Simple mapping of food names to emoji - in a real app, you'd use actual images
    const foodImages: Record<string, string> = {
      carrot: '🥕',
      cauliflower: '🥦',
      cucumber: '🥒',
      peas: '🌱',
      eggplant: '🍆',
      apple: '🍎',
      banana: '🍌',
      orange: '🍊',
      bread: '🍞',
      rice: '🍚',
      pasta: '🍝',
      pizza: '🍕',
      chicken: '🍗',
      meat: '🥩',
      fish: '🐟',
      egg: '🥚',
      milk: '🥛',
      cheese: '🧀',
      yogurt: '🍦',
      salad: '🥗',
      burger: '🍔'
    };
    
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(foodImages)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }
    
    return '🍽️'; // Default food icon
  };

  const getFilteredItems = () => {
    return foodItems.filter(item => item.category.toLowerCase() === activeTab);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-4">
        {/* Header with back button */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="w-10 h-10 bg-orange-400 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-orange-400 ml-4">Food Tracking</Text>
        </View>

        {/* Daily Summary Card */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <Text className="text-lg font-bold mb-2">Daily Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <View className="items-center">
              <CircularProgress
                size={100}
                strokeWidth={10}
                progress={macroTotals.calories}
                max={calorieGoal}
                value={macroTotals.calories}
                unit="kcal"
                color="#f8a100"
              />
            </View>
            
            <View className="flex-1 ml-4 justify-center">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Calories Consumed</Text>
                <Text className="font-bold">{macroTotals.calories} kcal</Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-600">Remaining</Text>
                <Text className={`font-bold ${remainingCalories < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {remainingCalories} kcal
                </Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-600">Goal</Text>
                <Text className="font-bold">{calorieGoal} kcal</Text>
              </View>
            </View>
          </View>
          
          <View className="flex-row justify-between mt-4">
            <View className="items-center">
              <Text className="text-gray-600">Carbs</Text>
              <Text className="font-bold">{macroTotals.carbs.toFixed(1)}g</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-gray-600">Protein</Text>
              <Text className="font-bold">{macroTotals.protein.toFixed(1)}g</Text>
            </View>
            
            <View className="items-center">
              <Text className="text-gray-600">Fats</Text>
              <Text className="font-bold">{macroTotals.fats.toFixed(1)}g</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-2">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`py-3 px-6 rounded-full mr-2 ${
                activeTab === tab ? 'bg-orange-400' : 'bg-gray-200'
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`font-medium ${
                  activeTab === tab ? 'text-white' : 'text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Food Items List */}
        {loading ? (
          <ActivityIndicator size="large" color="#F97316" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <Text className="text-lg font-bold my-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Items
            </Text>
            
            {getFilteredItems().length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center justify-center shadow-sm">
                <Text className="text-lg text-gray-500">No food items added yet.</Text>
              </View>
            ) : (
              getFilteredItems().map((item) => (
                <View 
                  key={item.id} 
                  className="bg-white rounded-xl p-4 mb-4 flex-row items-center shadow-sm"
                >
                  <View className="w-16 h-16 justify-center items-center">
                    <Text className="text-3xl">{getFoodImage(item.name)}</Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-xl font-bold">{item.name}</Text>
                    <Text className="text-gray-600">
                      {item.calories} cal | {item.fats}g fats | {item.carbs}g carbs | {item.protein}g proteins
                    </Text>
                    <Text className="text-gray-400 mt-1">{item.amount}</Text>
                  </View>
                </View>
              ))
            )}

            {/* Add Item Button */}
            <View className="flex-row mt-4 mb-8">
              <TouchableOpacity 
                className="flex-1 bg-orange-400 rounded-full py-4 items-center shadow-sm mr-2"
                onPress={() => router.push('/(food)/add-food')}
              >
                <Text className="text-white font-bold text-lg">Log Food</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-blue-500 rounded-full py-4 items-center shadow-sm ml-2"
                onPress={() => router.push('/(food)/create-food')}
              >
                <Text className="text-white font-bold text-lg">Create Food</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}