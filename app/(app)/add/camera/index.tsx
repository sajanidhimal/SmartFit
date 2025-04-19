import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/app/firebase';
import { logCameraDetectedFood } from '@/app/utils/database_service/calorie_intake_functions';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Get the current user
  const user = auth.currentUser;
  // Get router for navigation
  const router = useRouter();

  const openImagePicker = () => {
    setShowModal(true);
  };

  const handleCamera = async () => {
    setShowModal(false);
    
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPrediction(null);
      setShowConfirmation(false);
    }
  };
  
  const handleGallery = async () => {
    setShowModal(false);
    
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need media library permissions to make this work!');
      return;
    }
    
    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setPrediction(null);
      setShowConfirmation(false);
    }
  };

  const analyzeFood = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image of food first');
      return;
    }

    try {
      console.log("Analyzing food");
      setIsUploading(true);
      setPrediction(null);

      // Create form data for the upload
      const formData = new FormData();
      
      // Add image to form data
      const filename = image.split('/').pop();
      const fileType = 'image/' + (image.endsWith('.png') ? 'png' : 'jpeg');
      
      formData.append('file', {
        uri: image,
        name: filename,
        type: fileType,
      } as any);
      
      // Send to API endpoint
      try {
        // Match the API URL from requirements
        // const apiUrl = 'http://10.0.2.2:8000/predict/';
        const apiUrl = 'http://192.168.1.84:8000/predict/';
        
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
          setPrediction(data);
          setShowConfirmation(true);
        } else {
          Alert.alert('Error', data.detail || 'Failed to analyze food');
        }
      } catch (fetchError: any) {
        console.error('API fetch error:', fetchError);
        
        // For development/testing: mock response when the API is not available
        if (fetchError.message && fetchError.message.includes('Network request failed')) {
          const mockResponse = {
            "predicted_class": "pizza",
            "confidence": 0.9995276927947998,
            "top5_predictions": [
              {
                "class": "pizza",
                "confidence": 0.9995276927947998,
                "nutrition": {
                  "weight": 300,
                  "calories": 750,
                  "protein": 30,
                  "carbohydrates": 90,
                  "fats": 30,
                  "fiber": 6,
                  "sugars": 8,
                  "sodium": 1200
                }
              },
              {
                "class": "paella",
                "confidence": 0.0001505804102635011,
                "nutrition": {
                  "weight": 300,
                  "calories": 525,
                  "protein": 30,
                  "carbohydrates": 60,
                  "fats": 15,
                  "fiber": 5,
                  "sugars": 8,
                  "sodium": 750
                }
              }
            ],
            "nutrition": {
              "weight": 300,
              "calories": 750,
              "protein": 30,
              "carbohydrates": 90,
              "fats": 30,
              "fiber": 6,
              "sugars": 8,
              "sodium": 1200
            }
          };
          
          setPrediction(mockResponse);
          setShowConfirmation(true);
        } else {
          Alert.alert('Network Error', 'Could not connect to the food analysis service');
        }
      }
    } catch (error: any) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const saveFoodToDatabase = async () => {
    if (!user || !prediction || !prediction.nutrition) {
      Alert.alert('Error', 'Cannot save food data: missing user or prediction data');
      return;
    }
    
    try {
      setIsUploading(true);
      
      const foodData = {
        detectedFood: prediction.predicted_class,
        calories: prediction.nutrition.calories,
        carbs: prediction.nutrition.carbohydrates,
        protein: prediction.nutrition.protein,
        fats: prediction.nutrition.fats
      };
      
      const result = await logCameraDetectedFood(user.uid, foodData);
      
      // Handle both possible result formats (Result type or any)
      if (result && (result.success === true || result.id)) {
        Alert.alert(
          'Success', 
          `Your ${prediction.predicted_class} has been logged successfully!`,
          [{ text: 'OK', onPress: () => {
            resetView();
            router.back();
          }}]
        );
      } else {
        const errorMsg = result && result.error ? result.error : 'Failed to save food data';
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.error('Error saving food data:', error);
      Alert.alert('Error', 'Failed to save food data');
    } finally {
      setIsUploading(false);
    }
  };

  const resetView = () => {
    setImage(null);
    setPrediction(null);
    setShowConfirmation(false);
  };

  const renderImagePlaceholder = () => (
    <TouchableOpacity 
      style={styles.imagePlaceholder}
      onPress={openImagePicker}
    >
      <Ionicons name="camera-outline" size={40} color="#aaa" />
      <Text style={styles.placeholderText}>Tap to select a food image</Text>
    </TouchableOpacity>
  );

  const renderImage = (uri: string) => {
    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri }} style={styles.image} />
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => setImage(null)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render confirmation screen
  if (showConfirmation && prediction) {
    const { predicted_class, confidence, nutrition } = prediction;
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.confirmationContainer}>
          <Text style={styles.confirmationTitle}>Confirm Food Detection</Text>
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image! }} style={styles.previewImage} />
          </View>
          
          <View style={styles.detectionDetails}>
            <Text style={styles.detectedFood}>
              Detected: <Text style={styles.foodName}>{predicted_class}</Text>
            </Text>
            <Text style={styles.confidenceText}>
              Confidence: {(confidence * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition Information</Text>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Calories:</Text>
              <Text style={styles.nutritionValue}>{nutrition.calories} kcal</Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
              <Text style={styles.nutritionValue}>{nutrition.carbohydrates}g</Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Protein:</Text>
              <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fats:</Text>
              <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
            </View>
          </View>
          
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelButton]} 
              onPress={resetView}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={saveFoodToDatabase}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Save to Log</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            try {
              router.back();
            } catch (e) {
              console.error("Navigation error:", e);
              Alert.alert("Error", "Could not navigate back");
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Camera</Text>
        <View style={{width: 24}} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Take a photo of your food</Text>
          {image ? renderImage(image) : renderImagePlaceholder()}
        </View>
        
        <TouchableOpacity 
          style={[styles.analyzeButton, !image && styles.disabledButton]}
          onPress={analyzeFood}
          disabled={isUploading || !image}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze Food</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleCamera}>
              <Ionicons name="camera-outline" size={24} color="#FF9500" />
              <Text style={styles.modalOptionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleGallery}>
              <Ionicons name="images-outline" size={24} color="#FF9500" />
              <Text style={styles.modalOptionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.cancelOption]} 
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#FF9500" />
              <Text style={styles.modalOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 70,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  imagePlaceholder: {
    backgroundColor: '#fff',
    height: 240,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  placeholderText: {
    color: '#aaa',
    marginTop: 8,
    fontSize: 14,
  },
  imageContainer: {
    position: 'relative',
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  analyzeButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#FFB74D',
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    padding: 0,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#FF9500',
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  confirmationContainer: {
    flex: 1,
    padding: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  detectionDetails: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detectedFood: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  foodName: {
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  confidenceText: {
    fontSize: 14,
    color: '#777',
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#555',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#777',
  },
});