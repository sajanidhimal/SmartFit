// app/index.js
import React, { useEffect } from 'react';
import { View, Image, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import  {auth, db}  from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // First check if a user has completed onboarding
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      
      console.log('Has completed onboarding:', hasCompletedOnboarding);
      // Set up the auth state listener
      const unsubscribe = auth.onAuthStateChanged( async (user) => {
        setTimeout(() => {
          if (user) {
            // User is signed in
             checkUserProfile(user.uid)
            
          } else {
            // No user is signed in, go to auth flow
            router.replace('/(auth)/login');
          }
        }, 2000); // 2 second delay to show splash screen
      });

      return unsubscribe;
    };


    
    const checkUserProfile = async (userId: string) => {
      try {
        const userRef = doc(db, "userProfiles", userId);
        const userSnap = await getDoc(userRef);
        console.log('exists', userSnap.exists())
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log("User Firestore profile:", userData);
    
          
            router.replace("/(app)/home");
        
        } else {
          // No document in Firestore → assume no onboarding
          router.replace("/(auth)/onboarding");
        }
      } catch (error) {
        console.error("Error checking Firestore user profile:", error);
        router.replace("/(auth)/onboarding");
      }
    };
    

    checkAuthAndRedirect();
  }, []);

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Image
        source={require('../assets/images/splash-logo.png')}
        className="w-40 h-40 mb-6"
        resizeMode="contain"
      />
      <Text className="text-2xl font-bold mb-2 text-blue-600">SmartFit</Text>
      <Text className="text-gray-500 mb-8">Your Personal Fitness Companion</Text>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}