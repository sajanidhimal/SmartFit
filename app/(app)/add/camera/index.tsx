import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function CameraScreen() {
    const [topImage, setTopImage] = useState<string | null>(null);
    const [sideImage, setSideImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [showSideView, setShowSideView] = useState(false);

  const handleCameraOpen = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      if (!showSideView) {
        setTopImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
      setResponse(null);  
    }
  };
  
  const handleImagePick = async () => {
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need media library permissions to make this work!');
      return;
    }
    
    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      if (!showSideView) {
        setTopImage(result.assets[0].uri);
      } else {
        setSideImage(result.assets[0].uri);
      }
      setResponse(null);
    }
  };

  const clearImages = () => {
    setTopImage(null);
    setSideImage(null);
    setResponse(null);
  };

  const clearCurrentImage = () => {
    if (!showSideView) {
      setTopImage(null);
    } else {
      setSideImage(null);
    }
    setResponse(null);
  };

  const uploadImages = async () => {
    if (!topImage) {
      Alert.alert('Error', 'Please select a top view image first');
      return;
    }

    try {
      setIsUploading(true);
      setResponse(null);

    //   const apiUrl = 'http://192.168.18.51:5000/predict';
    const apiUrl = 'http://10.0.2.2:5000/predict';

      console.log('Attempting to upload to:', apiUrl);

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

      console.log('Added top image with type:', topFileType);

      // Add side image if available
      if (sideImage) {
        const sideFilename = sideImage.split('/').pop();
        const sideFileType = 'image/' + (sideImage.endsWith('.png') ? 'png' : 'jpeg');
        
        formData.append('side_image', {
          uri: sideImage,
          name: sideFilename,
          type: sideFileType,
        } as any);
        console.log('Added side image with type:', sideFileType);
      }

      // Log network state
      console.log('Starting network request...');
      
      // Make the API request
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Response received with status:', response.status);

        // Parse the response
        const responseData = await response.json();
        console.log('Response data:', JSON.stringify(responseData).substring(0, 150) + '...');
        
        setResponse(responseData);
        
        if (responseData.error) {
          Alert.alert('Error', responseData.error);
        } else {
          Alert.alert('Success', 'Food detected and analyzed successfully!');
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        // For testing when server is not available, use mock data
        if (fetchError.message && fetchError.message.includes('Network request failed')) {
          console.log('Using mock data due to network failure');
          // Mock response for testing UI when server is down
          const mockResponse = {
            food_detected: [
              {
                name: "Test Apple",
                weight_g: 150.5,
                calories: 80,
                protein: 0.3,
                carbs: 21.0,
                fats: 0.2,
                width_mm: 70.0,
                height_mm: 70.0,
                depth: 70.0,
                volume_cm3: 179.5
              }
            ]
          };
          setResponse(mockResponse);
          Alert.alert('Mock Data', 'Using test data - server appears to be down.');
        } else {
          throw fetchError; // Re-throw for the outer catch
        }
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Detailed error message with helpful suggestions
      const errorMsg = error.message || 'Unknown error';
      Alert.alert(
        'Upload Failed', 
        `There was an error uploading your images: ${errorMsg}

Troubleshooting:
- Check if your server is running
- Verify the IP address is correct
- Make sure your device and server are on the same network`
      );
      
      setResponse({ error: 'Upload failed: ' + errorMsg });
    } finally {
      setIsUploading(false);
    }
  };

  const renderPlaceholder = (viewType: string) => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="image-outline" size={80} color="#ccc" />
      <Text style={styles.placeholderText}>
        No {viewType} view image selected
      </Text>
    </View>
  );

  const renderFoodResults = () => {
    if (!response || !response.food_detected) return null;

    return (
      <View style={styles.foodResultsContainer}>
        <Text style={styles.foodResultsTitle}>Detected Food Items:</Text>
        {response.food_detected.map((food: any, index: number) => (
          <View key={index} style={styles.foodItemCard}>
            <Text style={styles.foodName}>{food.name}</Text>
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{food.weight_g.toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Weight</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{food.calories.toFixed(0)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
            </View>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.protein.toFixed(1)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.carbs.toFixed(1)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.fats.toFixed(1)}g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>
            <View style={styles.dimensionsRow}>
              <Text style={styles.dimensionsText}>
                Size: {food.width_mm.toFixed(1)} × {food.height_mm.toFixed(1)} × {food.depth.toFixed(1)} mm
              </Text>
              <Text style={styles.dimensionsText}>
                Volume: {food.volume_cm3.toFixed(1)} cm³
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainImageSection}>
        <Text style={styles.sectionTitle}>Top View Image (Required)</Text>
        {topImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: topImage }} style={styles.image} />
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setTopImage(null)}
            >
              <Ionicons name="close-circle" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : renderPlaceholder('top')}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            onPress={handleCameraOpen}
            style={styles.button}
            disabled={showSideView}
          >
            <Ionicons name="camera" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleImagePick}
            style={[styles.button, styles.secondaryButton]}
            disabled={showSideView}
          >
            <Ionicons name="images" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.sideViewToggle}
        onPress={() => setShowSideView(!showSideView)}
      >
        <Ionicons 
          name={showSideView ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#007BFF" 
        />
        <Text style={styles.sideViewToggleText}>
          {showSideView ? "Hide Side View" : "Add Side View (Optional)"}
        </Text>
      </TouchableOpacity>

      {showSideView && (
        <View style={styles.sideImageSection}>
          <Text style={styles.sectionTitle}>Side View Image (Optional)</Text>
          {sideImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: sideImage }} style={styles.image} />
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSideImage(null)}
              >
                <Ionicons name="close-circle" size={30} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : renderPlaceholder('side')}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              onPress={handleCameraOpen}
              style={styles.button}
            >
              <Ionicons name="camera" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleImagePick}
              style={[styles.button, styles.secondaryButton]}
            >
              <Ionicons name="images" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color="#6c757d" />
        <Text style={styles.infoText}>
          {sideImage ? 
            "Both images have coin for size reference." : 
            "Make sure your image contains a coin for size reference."}
        </Text>
      </View>

      <TouchableOpacity 
        style={[
          styles.uploadButton,
          (!topImage) && styles.disabledButton
        ]}
        onPress={uploadImages}
        disabled={isUploading || !topImage}
      >
        {isUploading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Ionicons name="nutrition" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Analyze Food</Text>
          </>
        )}
      </TouchableOpacity>

      {response && response.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{response.error}</Text>
        </View>
      )}

      {renderFoodResults()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  mainImageSection: {
    marginBottom: 16,
  },
  sideImageSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sideViewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e9f5ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  sideViewToggleText: {
    marginLeft: 8,
    color: '#007BFF',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007BFF', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: '#28a745',
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  clearButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    marginLeft: 8,
    color: '#6c757d',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
  },
  foodResultsContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  foodResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  foodItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dimensionsRow: {
    alignItems: 'center',
  },
  dimensionsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});