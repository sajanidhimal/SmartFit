// app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import FeatureScreens from '../components/FeatureScreens';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeatureScreens, setShowFeatureScreens] = useState(false);
  
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Email not verified, redirect to verification screen
        Alert.alert(
          'Email Not Verified',
          'Please verify your email address before continuing.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(auth)/verify-email');
              }
            }
          ]
        );
        return;
      }
      
      // Email is verified, check if user has a profile
      const userRef = doc(db, "userProfiles", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User has a profile, go to home
        router.replace('/(app)/home');
      } else {
        // User doesn't have a profile, show feature screens
        setShowFeatureScreens(true);
      }
    } catch (error:any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureScreensComplete = () => {
    // Feature screens are done, go to onboarding
    router.replace('/(auth)/onboarding');
  };

  // Show feature screens if needed
  if (showFeatureScreens) {
    return <FeatureScreens onComplete={handleFeatureScreensComplete} />;
  }

  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center items-center">
        <Image 
          source={require('../../assets/images/login-illustrator.png')} 
          className="w-64 h-64 mb-4"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold mb-2">Welcome Back!</Text>
        <Text className="text-gray-500 mb-8">Login to your existing account</Text>
        
        <View className="w-full mb-4">
          <View className="flex-row border border-gray-300 rounded-lg p-3 mb-4 items-center">
            <TextInput
              className="flex-1"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View className="flex-row border border-gray-300 rounded-lg p-3 mb-6 items-center">
            <TextInput
              className="flex-1"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/reset-password')}
            className="self-end mb-4"
          >
            <Text className="text-gray-600">Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleSignIn}
            disabled={loading}
            className="bg-orange-400 p-4 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">{loading ? "Signing In..." : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row mt-6">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-purple-600 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}