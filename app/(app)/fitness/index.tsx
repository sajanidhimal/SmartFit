//fiteness/index.ts
import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100 mb-16">
      <View className="p-4">
      <Text className="text-3xl font-bold text-gray-800 uppercase">ready to</Text>
      <Text className="text-3xl font-bold text-orange-400 uppercase">workout</Text>
      </View>
      <View className="p-4">
      <View className="flex-row justify-between mb-6 gap-4">
        <View className="flex-1 items-center bg-white rounded-lg p-4">
          <Text className="text-3xl font-bold text-gray-800">0</Text>
          <Text className="text-xl font-bold text-orange-500">Workouts</Text>
        </View>
        <View className="flex-1 items-center bg-white rounded-lg p-4">
          <Text className="text-3xl font-bold text-gray-800">350</Text>
          <Text className="text-xl font-bold text-orange-500">Kcals</Text>
        </View>
        <View className="flex-1 items-center bg-white rounded-lg p-4">
          <Text className="text-3xl font-bold text-gray-800">45</Text>
            <Text className="text-xl font-bold text-orange-500">Minutes</Text>
        </View>
      </View>
      </View>


      
      <ScrollView className="flex-1 p-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-[150px] mb-4">
        <View className="w-72 mr-4">
          <Image
            source={{ uri: 'https://fastly.picsum.photos/id/255/200/300.jpg?hmac=8h6Fxv1UswqZlMd2N1RMp5y8kqMk0TpucwH0sj9mlOU' }}
            className="w-full h-full rounded-lg"
            resizeMode="cover"
          />
        </View>
        <View className="w-72 mr-4">
          <Image
            source={{ uri: 'https://fastly.picsum.photos/id/255/200/300.jpg?hmac=8h6Fxv1UswqZlMd2N1RMp5y8kqMk0TpucwH0sj9mlOU' }}
            className="w-full h-full rounded-lg"
            resizeMode="cover"
          />
        </View>
        <View className="w-72">
          <Image
            source={{ uri: 'https://fastly.picsum.photos/id/255/200/300.jpg?hmac=8h6Fxv1UswqZlMd2N1RMp5y8kqMk0TpucwH0sj9mlOU' }}
            className="w-full h-full rounded-lg"
            resizeMode="cover"
          />
        </View>
      </ScrollView>
        <View className="bg-white rounded-lg p-4 shadow mb-4">
          <Text className="text-4xl font-bold text-gray-800 mb-4">Exercise</Text>
          
            <View className="flex-row flex-wrap justify-between">
            {[
              { icon: 'body-outline', title: 'Full Body', bg: 'https://picsum.photos/200/300?random=1' },
              { icon: 'bicycle-outline', title: 'Cardio', bg: 'https://picsum.photos/200/300?random=2' },
              { icon: 'barbell-outline', title: 'Strength', bg: 'https://picsum.photos/200/300?random=3' },
              { icon: 'walk-outline', title: 'Yoga', bg: 'https://picsum.photos/200/300?random=4' },
              { icon: 'fitness-outline', title: 'HIIT', bg: 'https://picsum.photos/200/300?random=5' },
              { icon: 'basketball-outline', title: 'Sports', bg: 'https://picsum.photos/200/300?random=6' },
              { icon: 'bicycle-outline', title: 'Cycling', bg: 'https://picsum.photos/200/300?random=7' },
              { icon: 'walk-outline', title: 'Running', bg: 'https://picsum.photos/200/300?random=8' },
            ].map((item, index) => (
              <TouchableOpacity 
              key={index} 
              className="w-[48%] h-40 mb-4 rounded-lg overflow-hidden"
              >
              <Image
                source={{ uri: item.bg }}
                className="absolute w-full h-full"
              />
              <View className="w-full h-full bg-black/30 items-center justify-center">
                <Ionicons name={item.icon} size={28} color="white" />
                <Text className="text-white font-medium mt-2">{item.title}</Text>
              </View>
              </TouchableOpacity>
            ))}
            </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
