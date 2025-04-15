import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, Dimensions } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

export default function SplashScreen({ onFinish, duration = 3000 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { width } = Dimensions.get('window');

  useEffect(() => {
    // Start the animation sequence
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

    // Call onFinish after duration
    const timer = setTimeout(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish, duration]);

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
          source={require('../../assets/images/splash-logo.png')}
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
                transformOrigin: 'left'
              }}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
} 