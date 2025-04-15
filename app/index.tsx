// app/index.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Text, ActivityIndicator, Animated, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

// Feature slide type
type FeatureSlide = {
  id: number;
  title: string;
  description: string;
  image: any;
};

// Feature slides
const features: FeatureSlide[] = [
  {
    id: 1,
    title: "Smart Calorie Estimation & Dietary Planner",
    description: "Ready to take control of your health? It just takes a minute to set up — let's begin!",
    image: require('../assets/images/feature-1.png')
  },
  {
    id: 2,
    title: "Balance Your Calories, Boost Your Health!",
    description: "Prioritize your health by staying aware of what you consume.",
    image: require('../assets/images/feature-2.png')
  },
  {
    id: 3,
    title: "Capture Your Food, Track Your Calories",
    description: "Take a photo of your food and stay in control of your calories.",
    image: require('../assets/images/feature-3.png')
  },
  {
    id: 4,
    title: "Burn Calories with Guided Exercises",
    description: "Stay active with guided exercises and burn calories effortlessly—every move brings you closer to your goals!",
    image: require('../assets/images/feature-4.png')
  },
  {
    id: 5,
    title: "Every Step Counts!",
    description: "Monitor your steps and track calories burned — achieve your goals, one step at a time.",
    image: require('../assets/images/feature-5.png')
  }
];

export default function IndexScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { width } = Dimensions.get('window');
  
  // State for app flow
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

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
            // User is signed in, check if they have a profile
            checkUserProfile(user.uid);
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
          router.replace("/(app)/home");
        } else {
          // User is logged in but no profile:
          // First show feature slides, then onboarding
          setIsLoading(false);
          setShowWelcome(true);
          // Fade in the welcome screen
          Animated.timing(welcomeFadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          setPendingRedirect("/(auth)/onboarding");
        }
      } catch (error) {
        console.error("Error checking Firestore user profile:", error);
        router.replace("/(auth)/onboarding");
      }
    };

    checkAuthAndRedirect();
  }, []);

  // Handle next slide in welcome
  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      // User has seen all feature slides, now go to onboarding
      router.replace("/(auth)/onboarding");
    }
  };

  // Handle skip in welcome
  const handleSkip = () => {
    // Skip the rest of the slides and go to onboarding
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
    return (
      <Animated.View className="flex-1 bg-white" style={{ opacity: welcomeFadeAnim }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
        >
          {features.map((feature) => (
            <View 
              key={feature.id} 
              style={{ width, height: '100%' }}
              className="p-6 justify-center items-center"
            >
              <Image
                source={feature.image}
                className="w-64 h-64 mb-8"
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold mb-4 text-center">{feature.title}</Text>
              <Text className="text-gray-600 text-center mb-8">{feature.description}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View className="flex-row justify-center mb-6">
          {features.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-orange-500 w-8' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* Bottom buttons */}
        <View className="flex-row justify-between items-center px-6 pb-8">
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-gray-500">Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleNext}
            className="bg-orange-400 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">
              {currentIndex === features.length - 1 ? "Let's Start" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }
  
  // Shouldn't reach here normally, but just in case
  return null;
}