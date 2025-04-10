import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function CameraScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [response, setResponse] = useState<any>(null);

  const handleCameraOpen = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
        setImage(result.assets[0].uri);
        setResponse(null);  
    }
  };
  
  const handleImagePick = async () => {
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
      return;
    }
    
    // Launch image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResponse(null);
      console.log(result.assets[0].uri);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResponse(null);
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setIsUploading(true);
      setResponse(null);

      
      const apiUrl = 'https://httpbin.org/post'; // This is a test API that will echo back your request

      // Read the image file as base64
      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for the upload
      const formData = new FormData();
      const filename = image.split('/').pop();
      const fileType = 'image/' + (image.endsWith('.png') ? 'png' : 'jpeg');
      
      formData.append('image', {
        uri: image,
        name: filename,
        type: fileType,
      } as any);

      formData.append('timestamp', new Date().toISOString());
      formData.append('user_id', 'user123');

      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Parse the response
      const responseData = await response.json();
      setResponse(responseData);
      
      Alert.alert('Success', 'Image uploaded successfully!');

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your image.');
      setResponse({ error: 'Upload failed: ' + (error.message || 'Unknown error') });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          onPress={handleCameraOpen}
          style={styles.button}
        >
          <Ionicons name="camera" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Open Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleImagePick}
          style={[styles.button, styles.secondaryButton]}
        >
          <Ionicons name="images" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>
      </View>

      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearImage}
          >
            <Ionicons name="close-circle" size={30} color="#FF3B30" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={uploadImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Upload Image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={80} color="#ccc" />
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Backend Response:</Text>
          <View style={styles.responseContent}>
            <Text style={styles.responseText}>
              {JSON.stringify(response, null, 2)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 20,
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
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
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
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  uploadButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  responseContent: {
    backgroundColor: '#f7f9fc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  responseText: {
    fontFamily: 'monospace',
    fontSize: 12,
  }
});