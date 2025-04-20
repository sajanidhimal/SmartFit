import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
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
      const apiUrl = 'http://localhost:8000/predict/';
      
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
      <TouchableOpacity style={styles.cameraButton}>
        <View style={styles.iconContainer}>
          <Ionicons name="camera" size={28} color="green" />
        </View>
        <Text style={styles.buttonText}>Advanced Camera Mode</Text>
      </TouchableOpacity>
    </Link>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Detection</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#777" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {!selectedImage ? (
          // Show camera/gallery options when no image is selected
          <View style={styles.optionsContainer}>
            <Text style={styles.instructionText}>
              Take a photo of your food or choose from gallery to detect nutritional information
            </Text>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleImageSelection(true)}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#EBD4F7' }]}>
                <Ionicons name="camera-outline" size={28} color="purple" />
              </View>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleImageSelection(false)}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#D4E5F7' }]}>
                <Ionicons name="images-outline" size={28} color="blue" />
              </View>
              <Text style={styles.buttonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {renderCameraButton()}
          </View>
        ) : (
          // Show detection results when image is selected
          <View style={styles.resultContainer}>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={resetDetection}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A2BE2" />
                <Text style={styles.loadingText}>Analyzing your food...</Text>
              </View>
            ) : detectedFood ? (
              <View style={styles.detectionCard}>
                <Text style={styles.foodTitle}>{detectedFood.detectedFood}</Text>
                
                <View style={styles.nutritionContainer}>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                    <Text style={styles.nutritionValue}>{detectedFood.calories} kcal</Text>
                  </View>
                  
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                    <Text style={styles.nutritionValue}>{detectedFood.carbs}g</Text>
                  </View>
                  
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                    <Text style={styles.nutritionValue}>{detectedFood.protein}g</Text>
                  </View>
                  
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionLabel}>Fats</Text>
                    <Text style={styles.nutritionValue}>{detectedFood.fats}g</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveDetectedFood}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save to Food Log</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to detect food. Please try again.</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => processImage(selectedImage)}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    gap: 16,
  },
  instructionText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    marginBottom: 16,
  },
  cameraButton: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    marginTop: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D8F5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  resultContainer: {
    gap: 24,
  },
  imageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 256,
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  detectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nutritionContainer: {
    gap: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionLabel: {
    color: '#666',
    fontSize: 16,
  },
  nutritionValue: {
    fontWeight: '500',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#8A2BE2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#F0E6FF',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#8A2BE2',
    fontWeight: '500',
  }
});