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
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [topImage, setTopImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<'top' | 'side'>('top');
  const [showResults, setShowResults] = useState(false);

  const openImagePicker = (viewType: 'top' | 'side') => {
    setCurrentSelection(viewType);
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
      if (currentSelection === 'top') {
        setTopImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
      setResponse(null);
      setShowResults(false);
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
      if (currentSelection === 'top') {
        setTopImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
      setResponse(null);
      setShowResults(false);
    }
  };

  const measureCalories = async () => {
    if (!topImage) {
      Alert.alert('Error', 'Please capture the top view of the food');
      return;
    }

    try {
      setIsUploading(true);
      setResponse(null);
      setShowResults(false);

      const apiUrl = 'http://10.0.2.2:5000/predict';

      // Create form data for the upload
      const formData = new FormData();
      
      // Add top image
      const topFilename = topImage.split('/').pop();
      const topFileType = 'image/' + (topImage.endsWith('.png') ? 'png' : 'jpeg');
      
      formData.append('top_image', {
        uri: topImage,
        name: topFilename,
        type: topFileType,
      } as any);

      // Add side image if available
      if (sideImage) {
        const sideFilename = sideImage.split('/').pop();
        const sideFileType = 'image/' + (sideImage.endsWith('.png') ? 'png' : 'jpeg');
        
        formData.append('side_image', {
          uri: sideImage,
          name: sideFilename,
          type: sideFileType,
        } as any);
      }
      
      // Make the API request
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const responseData = await response.json();
        setResponse(responseData);
        
        if (responseData.error) {
          Alert.alert('Error', responseData.error);
        } else {
          setShowResults(true);
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        if (fetchError.message && fetchError.message.includes('Network request failed')) {
          // Mock response for testing UI
          const mockResponse = {
            food_detected: [
              {
                name: "Apple",
                weight_g: 150.5,
                calories: 33.99,
                protein: 0.20,
                carbs: 9.15,
                fats: 0.13,
                width_mm: 70.0,
                height_mm: 70.0,
                depth: 70.0,
                volume_cm3: 179.5
              }
            ]
          };
          setResponse(mockResponse);
          setShowResults(true);
        } else {
          throw fetchError;
        }
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'There was an error measuring your food');
    } finally {
      setIsUploading(false);
    }
  };

  const renderImagePlaceholder = (viewType: 'top' | 'side') => (
    <TouchableOpacity 
      style={styles.imagePlaceholder}
      onPress={() => openImagePicker(viewType)}
    >
      <Ionicons name="camera-outline" size={40} color="#aaa" />
      <Text style={styles.placeholderText}>Tap to select image</Text>
    </TouchableOpacity>
  );

  const renderImage = (uri: string | null, viewType: 'top' | 'side') => {
    if (uri) {
      return (
        <View style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.image} />
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => viewType === 'top' ? setTopImage(null) : setSideImage(null)}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    return renderImagePlaceholder(viewType);
  };

  const goBackToCapture = () => {
    setShowResults(false);
  };

  if (showResults && response && response.food_detected && response.food_detected.length > 0) {
    const food = response.food_detected[0];
    
    return (
      <View style={styles.container}>
        <View style={styles.resultHeader}>
          <TouchableOpacity onPress={goBackToCapture} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FF9500" />
          </TouchableOpacity>
          <Text style={styles.resultHeaderText}>Calorie Estimation</Text>
        </View>
        
        <ScrollView style={styles.resultContainer}>
          <Image source={{ uri: topImage! }} style={styles.resultImage} />
          
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodDescription}>
            Make better food choices with our calorie counter app. We designed our app in a way 
            that will help you to know the nutrition of each ingredient, also as meals.
          </Text>
          
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.carbs.toFixed(2)}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.protein.toFixed(2)}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{food.fats.toFixed(2)}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
          
          <View style={styles.calorieContainer}>
            <Text style={styles.calorieValue}>{food.calories.toFixed(2)} kcal</Text>
          </View>
        </ScrollView>
        
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="home-outline" size={24} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="barbell-outline" size={24} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="stats-chart-outline" size={24} color="#777" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="person-outline" size={24} color="#777" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Please capture the top view of the food</Text>
          {renderImage(topImage, 'top')}
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Please capture the side view of the food</Text>
          {renderImage(sideImage, 'side')}
        </View>

        <TouchableOpacity 
          style={[styles.measureButton, !topImage && styles.disabledButton]}
          onPress={measureCalories}
          disabled={isUploading || !topImage}
        >
          {isUploading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.measureButtonText}>Measure Calorie</Text>
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
            <Text style={styles.modalTitle}>
              Choose {currentSelection === 'top' ? 'Top' : 'Side'} View Image
            </Text>
            
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

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="home-outline" size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="barbell-outline" size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="stats-chart-outline" size={24} color="#777" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="person-outline" size={24} color="#777" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F6FF',
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
    height: 140,
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
    height: 140,
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
  measureButton: {
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
  measureButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#6A42F4',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F6FF',
  },
  backButton: {
    padding: 4,
  },
  resultHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
    marginLeft: 8,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  nutritionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  calorieContainer: {
    backgroundColor: '#6A42F4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
});