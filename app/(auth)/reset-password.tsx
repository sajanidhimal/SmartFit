// app/(auth)/reset-password.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import  {auth}  from '../firebase';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const router = useRouter();

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error:any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center">
        <Image 
          source={require('../../assets/images/reset-password.png')} 
          className="w-24 h-24 self-center mb-6"
          resizeMode="contain"
        />
        <Text className="text-2xl font-bold mb-2">Reset Password</Text>
        <Text className="text-gray-500 mb-8">Enter your email to receive a reset code</Text>
        
        <View className="w-full mb-6">
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Username@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            onPress={handleSendResetEmail}
            disabled={loading}
            className="bg-orange-400 p-4 rounded-lg items-center mb-4"
          >
            <Text className="text-white font-semibold">{loading ? "Sending..." : "Send"}</Text>
          </TouchableOpacity>
          
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Back To? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-purple-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {emailSent && (
          <View className="bg-green-100 p-4 rounded-lg border border-green-300">
            <Text className="text-green-800">Password reset email sent! Check your inbox for further instructions.</Text>
          </View>
        )}
      </View>
    </View>
  );
}