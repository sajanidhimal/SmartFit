import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = () => {
    // In a real app, you would validate and authenticate here
    router.replace('/(app)/home');
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <View className="flex-1 justify-center">
        {/* Logo/App name */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <Ionicons name="fitness" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-800">FitTracker</Text>
          <Text className="text-gray-500">Track your fitness journey</Text>
        </View>
        
        {/* Login Form */}
        <View className="space-y-4 mb-6">
          <View className="space-y-2">
            <Text className="text-gray-700 ml-1">Email</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <Ionicons name="mail-outline" size={20} color="#777" className="mr-2" />
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 ml-2"
              />
            </View>
          </View>
          
          <View className="space-y-2">
            <Text className="text-gray-700 ml-1">Password</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <Ionicons name="lock-closed-outline" size={20} color="#777" className="mr-2" />
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="flex-1 ml-2"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity className="items-end">
            <Text className="text-primary font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        {/* Login Button */}
        <TouchableOpacity 
          className="bg-primary rounded-lg py-4 items-center shadow"
          onPress={handleLogin}
        >
          <Text className="text-white font-bold text-lg">Login</Text>
        </TouchableOpacity>
        
        {/* Or divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-500">Or continue with</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>
        
        {/* Social Login */}
        <View className="flex-row justify-center space-x-4">
          <TouchableOpacity className="w-12 h-12 border border-gray-300 rounded-full items-center justify-center">
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
          
          <TouchableOpacity className="w-12 h-12 border border-gray-300 rounded-full items-center justify-center">
            <Ionicons name="logo-apple" size={24} color="#000" />
          </TouchableOpacity>
          
          <TouchableOpacity className="w-12 h-12 border border-gray-300 rounded-full items-center justify-center">
            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Sign Up */}
      <View className="flex-row justify-center mt-6 mb-4">
        <Text className="text-gray-600">Don't have an account? </Text>
        <TouchableOpacity>
          <Text className="text-primary font-medium">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}