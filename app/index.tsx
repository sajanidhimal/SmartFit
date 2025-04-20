// app/index.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Text, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import FeatureScreens from './components/FeatureScreens';

export default function IndexScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { width } = Dimensions.get('window');
  
  // State for app flow
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Start the splash animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    const checkAuthAndRedirect = async () => {
      // Set up the auth state listener
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        // Give the animation time to complete before deciding next step
        setTimeout(() => {
          if (user) {
            // Check if email is verified first
            if (!user.emailVerified) {
              // Email not verified, redirect to verification screen
              console.log("Email not verified, going to verification screen");
              router.replace('/(auth)/verify-email');
            } else {
              // Email is verified, check if they have a profile
              checkUserProfile(user.uid);
            }
          } else {
            // No user is signed in, go to login
            router.replace('/(auth)/login');
          }
        }, 2500); // 2.5 second delay to show splash screen
      });

      return unsubscribe;
    };

    const checkUserProfile = async (userId: string) => {
      try {
        const userRef = doc(db, "userProfiles", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User has profile, go to home
          console.log("User has profile, going to home");
          router.replace("/(app)/home");
        } else {
          // User is logged in but no profile:
          // First show feature slides, then onboarding
          setIsLoading(false);
          setShowWelcome(true);
        }
      } catch (error) {
        console.error("Error checking Firestore user profile:", error);
        router.replace("/(auth)/onboarding");
      }
    };

    checkAuthAndRedirect();
  }, []);

  const handleFeatureScreensComplete = () => {
    // Feature screens are done, go to onboarding
    router.replace("/(auth)/onboarding");
  };

  // Splash screen view
  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: 'center',
            justifyContent: 'center',
            width: width * 0.8
          }}
        >
          <Image
            source={require('../assets/images/splash-logo.png')}
            className="w-48 h-48 mb-6"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold mb-3 text-orange-500">SmartFit</Text>
          <Text className="text-gray-600 mb-8 text-center text-lg">Your Personal Fitness Companion</Text>
          
          <View className="w-full px-8">
            <View className="h-1 bg-gray-200 rounded-full w-full mb-2">
              <Animated.View 
                className="h-1 bg-orange-400 rounded-full"
                style={{ 
                  transform: [
                    { scaleX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    }) }
                  ],
                  alignSelf: 'flex-start',
                  width: '100%'
                }}
              />
            </View>
          </View>
          
          <ActivityIndicator size="large" color="#f97316" className="mt-4" />
        </Animated.View>
      </View>
    );
  }

  // Welcome screen view
  if (showWelcome) {
    return <FeatureScreens onComplete={handleFeatureScreensComplete} />;
  }
  
  // Shouldn't reach here normally, but just in case
  return null;
}