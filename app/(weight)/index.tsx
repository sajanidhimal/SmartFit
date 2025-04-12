
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Info } from 'react-native-feather';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
export default function TargetWeightScreen() {
  const navigation = useNavigation();
  const [targetWeight, setTargetWeight] = useState(60);

  return (
    <View className="flex-1 bg-slate-100">
      {/* Header with back button */}
      <View className="pt-10 px-6">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center"
        >
          <ChevronLeft width={24} height={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* BMI Info Card */}
      <View className="mx-6 mt-8 bg-white p-4 rounded-xl flex-row items-center">
        <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center mr-3">
          <Info width={20} height={20} color="#F59E0B" />
        </View>
        <Text className="text-gray-700 flex-1">
          According to your BMI, your ideal weight is between{' '}
          <Text className="text-amber-500 font-bold">55.8 - 75.2 kg</Text>.
        </Text>
      </View>

      {/* Target Icon */}
      <View className="items-center mt-8">
        <Image 
        //   source={require('./assets/icon.png')} 
          className="w-24 h-24"
          // If you don't have an actual image, you can use a placeholder:
          source={{ uri: 'https://placeholder.com/100' }} 
        />
      </View>

      {/* Title Section */}
      <View className="mt-10 px-6">
        <Text className="text-3xl font-bold text-gray-800 text-center">
          What is Your Target Weight?
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          We use this information to calculate your daily goal.
        </Text>
      </View>

      {/* Slider Section */}
      <View className="px-6 mt-8">
        <View className="flex-row items-center justify-between">
            {/* have the actual weight from previous input */}
          <Text className="text-4xl font-light text-gray-300">55</Text>
          <Text className="text-xl font-bold text-amber-500">{'>>'}</Text>
          <View className="bg-amber-100 px-8 py-2 rounded-full">
            <Text className="text-4xl font-bold text-amber-500">{targetWeight}</Text>
          </View>
        </View>

        <Slider
          className="mt-4"
          minimumValue={55}
          maximumValue={75}
          value={targetWeight}
          onValueChange={value => setTargetWeight(Math.round(value))}
          step={1}
          minimumTrackTintColor="#F59E0B"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#F59E0B"
        />
      </View>

      {/* Sweaty Choice */}
      <View className="mx-6 mt-8 py-4 px-2">
        <View className="flex-row items-center justify-center mb-2">
          <View className="w-6 h-6 bg-amber-400 rounded-full mr-2" />
          <Text className="text-xl font-bold text-amber-400">Sweaty Choice</Text>
        </View>
        <Text className="text-gray-400 text-center">
          You will gain 9.1% of body weight and enjoy continuous health benefits.
        </Text>
      </View>

      {/* Next Button */}
      <View className="px-6 mt-6">
        <TouchableOpacity className="bg-amber-400 py-4 rounded-xl">
          <Text className="text-white text-center text-xl font-medium">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}