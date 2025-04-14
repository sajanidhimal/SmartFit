import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { searchFoodItems, getFoodItems } from '../utils/database_service/food_functions';
import { logFoodIntake } from '../utils/database_service/calorie_intake_functions';

export interface FoodItem {
  id: string;
  name: string;
  image?: string;
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  category: string;
}

export default function AddFoodScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner' | 'other'>('lunch');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const tabs: ('breakfast' | 'lunch' | 'dinner' | 'other')[] = ['breakfast', 'lunch', 'dinner', 'other'];

  // Effect for handling category changes and search
  useEffect(() => {
    if (searchTerm.length > 2) {
      handleSearch();
    } else {
      // When no search term is present, load food items for the active tab
      loadCategoryFoodItems(activeTab);
    }
  }, [searchTerm, activeTab]); // Re-run when either searchTerm or activeTab changes

  // Function to load food items for the current category/tab
  const loadCategoryFoodItems = async (category: string) => {
    setLoading(true);
    try {
      const result = await getFoodItems(category);
      if (result.success && Array.isArray(result.data)) {
        // Make sure each item has an id property
        const cleaned = result.data.map((item) => ({
          id: item.id || `temp-${Math.random().toString(36).substr(2, 9)}`, // Ensure id exists
          name: item.name,
          calories: Number(item.calories) || 0,
          carbs: Number(item.carbs) || 0,
          protein: Number(item.protein) || 0,
          fats: Number(item.fats) || 0,
          amount: item.amount || '',
          image: item.image ?? undefined,
          category: category, // Ensure we set the category
        }));
        setSearchResults(cleaned);
      } else {
        console.error('Failed to load food items:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error(`Error loading ${category} food items:`, error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await searchFoodItems(searchTerm);
      if (result.success && Array.isArray(result.data)) {
        // Ensure each search result has an id property
        const cleaned = result.data.map((item) => ({
          id: item.id || `temp-${Math.random().toString(36).substr(2, 9)}`, // Ensure id exists
          name: item.name,
          calories: Number(item.calories) || 0,
          carbs: Number(item.carbs) || 0,
          protein: Number(item.protein) || 0,
          fats: Number(item.fats) || 0,
          amount: item.amount || '',
          image: item.image ?? undefined,
          category: item.category || activeTab,
        }));
        setSearchResults(cleaned);
      } else {
        console.error('Search failed:', result.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error during search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addFoodItem = async (food: FoodItem) => {
    if (!user) return;

    try {
      const intakeData = {
        foodId: food.id,
        name: food.name,
        category: activeTab,
        amount: food.amount || '100 gr',
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fats: food.fats,
        image: food.image || '',
        date: new Date()
      };

      const result = await logFoodIntake(user.uid, intakeData);
      if (result.success) {
        showSuccessMessage('Food added to your daily intake');
      } else {
        console.error('Failed to log food intake:', result.error);
      }
    } catch (error) {
      console.error('Error adding food item:', error);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
      
    }, 2000);
  };

  const getFoodImage = (name: string): string => {
    const foodImages: Record<string, string> = {
      carrot: '🥕',
      cauliflower: '🥦',
      broccoli: '🥦',
      cucumber: '🥒',
      peas: '🌱',
      eggplant: '🍆',
      apple: '🍎',
      banana: '🍌',
      orange: '🍊',
      strawberry: '🍓',
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
      burger: '🍔',
      sandwich: '🥪',
      coffee: '☕',
      tea: '🍵',
      water: '💧',
      juice: '🧃',
      breakfast: '🍳',
      lunch: '🍲',
      dinner: '🍽️',
    };

    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(foodImages)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }

    return '🍽️';
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            className="w-10 h-10 bg-orange-400 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-orange-400 ml-4">Log Food</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`py-3 px-6 rounded-full mr-2 ${
                activeTab === tab ? 'bg-orange-400' : 'bg-gray-200'
              }`}
              onPress={() => {
                setActiveTab(tab);
                setSearchTerm(''); // Clear search when changing tabs
              }}
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

        {/* Search Bar */}
        <View className="bg-white rounded-full px-4 py-3 mb-6 flex-row items-center shadow-sm">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder={`Search ${activeTab} items...`}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Success Message */}
        {successMessage && (
          <View className="absolute top-1/4 left-0 right-0 bg-white p-6 mx-4 z-10 rounded-lg shadow-lg">
            <Text className="text-2xl font-bold mb-2">Success</Text>
            <Text className="text-base mb-6">{successMessage}</Text>
          </View>
        )}

        {/* Food Items List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {searchResults.length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center justify-center shadow-sm">
                <Text className="text-lg text-gray-500">
                  {searchTerm.length > 0 
                    ? 'No food items found. Try a different search or create a new food item.' 
                    : `No ${activeTab} items available. Create some food items first.`}
                </Text>
                
                <TouchableOpacity 
                  className="mt-4 bg-blue-500 rounded-full py-3 px-6"
                  onPress={() => router.push('/(food)/create-food')}
                >
                  <Text className="text-white font-bold">Create New Food</Text>
                </TouchableOpacity>
              </View>
            ) : (
              searchResults.map((item) => (
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
                      {item.calories} cal | {item.carbs}g carbs | {item.protein}g protein | {item.fats}g fat
                    </Text>
                    <Text className="text-gray-400 mt-1">{item.amount}</Text>
                  </View>
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center"
                    onPress={() => addFoodItem(item)}
                  >
                    <Ionicons name="add" size={24} color="#F97316" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}