import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '@/app/firebase';
import { logCameraDetectedFood } from '@/app/utils/database_service/calorie_intake_functions';
import { Link } from 'expo-router';

export default function AddScreen() {

  
  const [loading, setLoading] = useState(false);
  const [detectedFood, setDetectedFood] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const router = useRouter();
  
  const handleImageSelection = async (useCamera: boolean) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Denied", 
          `We need ${useCamera ? 'camera' : 'photo library'} permission to detect food.`
        );
        return;
      }
      
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  const processImage = async (imageUri: string) => {
    setLoading(true);
    setDetectedFood(null);
    
    try {
      console.log("Analyzing food");
      
      // Create form data for the upload
      const formData = new FormData();
      
      // Add image to form data
      const filename = imageUri.split('/').pop();
      const fileType = 'image/' + (imageUri.endsWith('.png') ? 'png' : 'jpeg');
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);
      
      // Send to API endpoint
      const apiUrl = 'http://127.0.0.1:8000/predict/';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log("data", data);
      
      if (response.ok) {
        // Transform API response to match our expected format
        const foodData = {
          detectedFood: data.predicted_class,
          calories: data.nutrition.calories,
          carbs: data.nutrition.carbohydrates,
          protein: data.nutrition.protein,
          fats: data.nutrition.fats
        };
        console.log("foodData", foodData);
        setDetectedFood(foodData);
      } else {
        throw new Error(data.detail || 'Failed to analyze food');
      }
    } catch (error: any) {
      console.error('Error detecting food:', error);
      
      // For development/testing: mock response when the API is not available
      if (error.message && error.message.includes('Network request failed')) {
        console.log("Using mock data due to network error");
        const mockData = {
          detectedFood: 'Pizza',
          calories: 750,
          carbs: 90,
          protein: 30,
          fats: 30
        };
        setDetectedFood(mockData);
      } else {
        Alert.alert('Error', 'Failed to detect food. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const saveDetectedFood = async () => {
    if (!detectedFood) return;
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save food data');
      return;
    }
    
    setLoading(true);
    try {
      const result = await logCameraDetectedFood(user.uid, {
        ...detectedFood,
        date: new Date()
      });
      
      if (result && (result.success === true || result.id)) {
        Alert.alert(
          'Success', 
          `${detectedFood.detectedFood} has been added to your food log!`,
          [{ 
            text: 'OK', 
            onPress: handleNavigateBack
          }]
        );
      } else {
        const errorMsg = result && result.error ? result.error : 'Failed to save food data';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert('Error', 'Failed to save food data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetDetection = () => {
    setSelectedImage(null);
    setDetectedFood(null);
  };
  
  // Navigation helpers that handle navigation context availability
  const handleNavigateBack = () => {
    resetDetection();
    router.back();
  };
  
  const renderCameraButton = () => (
    <Link href="/add/camera" asChild>
      <TouchableOpacity 
        className="bg-white p-6 rounded-lg flex-row items-center shadow-sm justify-center mt-4"
      >
        <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
          <Ionicons name="camera" size={28} color="green" />
        </View>
        <Text className="text-lg font-medium">Advanced Camera Mode</Text>
      </TouchableOpacity>
    </Link>
  );
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Food Detection</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#777" />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1 p-4">
        {!selectedImage ? (
          // Show camera/gallery options when no image is selected
          <View className="space-y-4">
            <Text className="text-gray-600 text-center mb-6">
              Take a photo of your food or choose from gallery to detect nutritional information
            </Text>
            
            <TouchableOpacity 
              className="bg-white p-6 rounded-lg flex-row items-center shadow-sm justify-center"
              onPress={() => handleImageSelection(true)}
            >
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="camera-outline" size={28} color="purple" />
              </View>
              <Text className="text-lg font-medium">Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white p-6 rounded-lg flex-row items-center shadow-sm justify-center"
              onPress={() => handleImageSelection(false)}
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="images-outline" size={28} color="blue" />
              </View>
              <Text className="text-lg font-medium">Choose from Gallery</Text>
            </TouchableOpacity>
            
            {renderCameraButton()}
          </View>
        ) : (
          // Show detection results when image is selected
          <View className="space-y-6">
            <View className="items-center">
              <Image 
                source={{ uri: selectedImage }}
                className="w-full h-64 rounded-lg"
                resizeMode="cover"
              />
              
              <TouchableOpacity 
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 p-2 rounded-full"
                onPress={resetDetection}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#8A2BE2" />
                <Text className="mt-4 text-gray-600">Analyzing your food...</Text>
              </View>
            ) : detectedFood ? (
              <View className="bg-white rounded-lg p-5 shadow-sm">
                <Text className="text-xl font-bold mb-4">{detectedFood.detectedFood}</Text>
                
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Calories</Text>
                    <Text className="font-medium">{detectedFood.calories} kcal</Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Carbs</Text>
                    <Text className="font-medium">{detectedFood.carbs}g</Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Protein</Text>
                    <Text className="font-medium">{detectedFood.protein}g</Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Fats</Text>
                    <Text className="font-medium">{detectedFood.fats}g</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  className="bg-purple-600 py-3 rounded-lg mt-6 items-center"
                  onPress={saveDetectedFood}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white font-medium">Save to Food Log</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center py-8">
                <Text className="text-gray-600">Failed to detect food. Please try again.</Text>
                <TouchableOpacity 
                  className="mt-4 bg-purple-100 p-3 rounded-lg"
                  onPress={() => processImage(selectedImage)}
                >
                  <Text className="text-purple-700">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}