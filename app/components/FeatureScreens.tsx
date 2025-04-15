import React, { useRef, useState } from 'react';
import { View, Image, Text, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';

// Feature slide type
export type FeatureSlide = {
  id: number;
  title: string;
  description: string;
  image: any;
};

// Feature slides data
export const features: FeatureSlide[] = [
  {
    id: 1,
    title: "Smart Calorie Estimation & Dietary Planner",
    description: "Ready to take control of your health? It just takes a minute to set up — let's begin!",
    image: require('../../assets/images/feature-1.png')
  },
  {
    id: 2,
    title: "Balance Your Calories, Boost Your Health!",
    description: "Prioritize your health by staying aware of what you consume.",
    image: require('../../assets/images/feature-2.png')
  },
  {
    id: 3,
    title: "Capture Your Food, Track Your Calories",
    description: "Take a photo of your food and stay in control of your calories.",
    image: require('../../assets/images/feature-3.png')
  },
  {
    id: 4,
    title: "Burn Calories with Guided Exercises",
    description: "Stay active with guided exercises and burn calories effortlessly—every move brings you closer to your goals!",
    image: require('../../assets/images/feature-4.png')
  },
  {
    id: 5,
    title: "Every Step Counts!",
    description: "Monitor your steps and track calories burned — achieve your goals, one step at a time.",
    image: require('../../assets/images/feature-5.png')
  }
];

interface FeatureScreensProps {
  onComplete: () => void;
}

export default function FeatureScreens({ onComplete }: FeatureScreensProps) {
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const welcomeFadeAnim = useRef(new Animated.Value(1)).current;

  // Handle next slide in welcome
  const handleNext = () => {
    if (currentIndex < features.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      // User has seen all feature slides, now call the complete function
      onComplete();
    }
  };

  // Handle skip
  const handleSkip = () => {
    // Skip the rest of the slides
    onComplete();
  };

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