// app/(auth)/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import {auth}  from '../firebase'; 
import { Feather } from '@expo/vector-icons';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // After signup, redirect to onboarding screens
      router.push('/(auth)/onboarding');
    } catch (error:any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl font-bold mb-2">Create Account</Text>
        <Text className="text-gray-500 mb-8">Sign up to get started</Text>
        
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
          
          <View className="flex-row border border-gray-300 rounded-lg p-3 mb-4 items-center">
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
          
          <View className="flex-row border border-gray-300 rounded-lg p-3 mb-6 items-center">
            <TextInput
              className="flex-1"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="gray" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={handleSignUp}
            disabled={loading}
            className="bg-orange-400 p-4 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">{loading ? "Creating Account..." : "Sign Up"}</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row mt-6">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-purple-600 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}