// app/create-food.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addFoodItem } from '../utils/database_service/food_functions';

interface FoodFormData {
  name: string;
  amount: string;
  calories: string;
  carbs: string;
  protein: string;
  fats: string;
}

export default function CreateFoodScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner' | 'other'>('lunch');
  const [foodData, setFoodData] = useState<FoodFormData>({
    name: '',
    amount: '100 gr',
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
  });
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tabs: ('breakfast' | 'lunch' | 'dinner' | 'other')[] = ['breakfast', 'lunch', 'dinner', 'other'];

  const handleChange = (name: keyof FoodFormData, value: string) => {
    setFoodData({
      ...foodData,
      [name]: value,
    });
  };

  const validateForm = (): boolean => {
    if (!foodData.name.trim()) {
      alert('Please enter a food name');
      return false;
    }
    
    if (!foodData.calories.trim()) {
      alert('Please enter calorie information');
      return false;
    }
    
    // Validate numeric fields
    const numericFields: (keyof FoodFormData)[] = ['calories', 'carbs', 'protein', 'fats'];
    for (const field of numericFields) {
      if (foodData[field] && isNaN(Number(foodData[field]))) {
        alert(`Please enter a valid number for ${field}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await addFoodItem(activeTab, {
        name: foodData.name,
        amount: foodData.amount || '100 gr',
        calories: foodData.calories ? Number(foodData.calories) : 0,
        carbs: foodData.carbs ? Number(foodData.carbs) : 0,
        protein: foodData.protein ? Number(foodData.protein) : 0,
        fats: foodData.fats ? Number(foodData.fats) : 0,
      });
      
      if (result.success) {
        showSuccessMessage('Food item created successfully');
        // Clear form for next entry
        setFoodData({
          name: '',
          amount: '100 gr',
          calories: '',
          carbs: '',
          protein: '',
          fats: '',
        });
      } else {
        alert('Failed to create food item: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating food item:', error);
      alert('An error occurred while creating food item');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-50">
      <ScrollView className="flex-1 p-4">
        {/* Header with back button */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="w-10 h-10 bg-orange-400 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-orange-400 ml-4">Create Food</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-6">
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

        {/* Success Message Popup */}
        {successMessage ? (
          <View className="absolute top-1/4 left-0 right-0 bg-white p-6 mx-4 z-10 rounded-lg shadow-lg">
            <Text className="text-2xl font-bold mb-2">Success</Text>
            <Text className="text-base mb-6">{successMessage}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-medium mb-2">Food Name</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter food name"
            value={foodData.name}
            onChangeText={(text) => handleChange('name', text)}
          />

          <Text className="text-lg font-medium mb-2">Amount</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="e.g., 100 gr, 1 Piece"
            value={foodData.amount}
            onChangeText={(text) => handleChange('amount', text)}
          />

          <Text className="text-lg font-medium mb-2">Calories</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter calories"
            value={foodData.calories}
            onChangeText={(text) => handleChange('calories', text)}
            keyboardType="numeric"
          />

          <Text className="text-lg font-medium mb-2">Carbohydrates (g)</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter carbs in grams"
            value={foodData.carbs}
            onChangeText={(text) => handleChange('carbs', text)}
            keyboardType="numeric"
          />

          <Text className="text-lg font-medium mb-2">Protein (g)</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter protein in grams"
            value={foodData.protein}
            onChangeText={(text) => handleChange('protein', text)}
            keyboardType="numeric"
          />

          <Text className="text-lg font-medium mb-2">Fat (g)</Text>
          <TextInput
            className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter fat in grams"
            value={foodData.fats}
            onChangeText={(text) => handleChange('fats', text)}
            keyboardType="numeric"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          className={`rounded-full py-4 mb-8 items-center shadow-sm ${isLoading ? 'bg-orange-300' : 'bg-orange-400'}`}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-white font-bold text-lg">
            {isLoading ? 'Creating...' : 'Create Food Item'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}