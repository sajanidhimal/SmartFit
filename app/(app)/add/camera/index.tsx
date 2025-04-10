import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen() {
  const [image, setImage] = useState(null);

  const handleCameraOpen = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
    //   setImage(result.assets[0].uri);
    //   console.log(result.assets[0].uri);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
    //   setImage(result.assets[0].uri);
    //   console.log(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity 
        onPress={handleCameraOpen}
        style={{ backgroundColor: '#007BFF', padding: 15, borderRadius: 5, marginBottom: 15 }}
      >
        <Text style={{ color: 'white' }}>Open Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleImagePick}
        style={{ backgroundColor: '#28a745', padding: 15, borderRadius: 5, marginBottom: 20 }}
      >
        <Text style={{ color: 'white' }}>Pick Image</Text>
      </TouchableOpacity>

      {image && (
        <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />
      )}
    </View>
  );
}