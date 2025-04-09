import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DayItem {
  day: string;
  date: number;
  active: boolean;
}

interface WeekCalendarProps {
  weekDays: DayItem[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectDay: (index: number) => void;
}

export default function WeekCalendar({
  weekDays,
  onPrevWeek,
  onNextWeek,
  onSelectDay
}: WeekCalendarProps) {
  return (
    <View className="flex-row items-center justify-between py-4 bg-white rounded-lg my-4">
      <TouchableOpacity className="px-2" onPress={onPrevWeek}>
        <Ionicons name="chevron-back" size={24} color="#ccc" />
      </TouchableOpacity>
      
      <View className="flex-row flex-1 justify-around">
        {weekDays.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className="items-center"
            onPress={() => onSelectDay(index)}
          >
            <Text className="text-gray-500 text-xs mb-1">{item.day}</Text>
            <View className={`w-8 h-8 rounded-full items-center justify-center ${item.active ? 'bg-secondary' : 'bg-gray-100'}`}>
              <Text className={`${item.active ? 'text-white' : 'text-gray-500'}`}>
                {item.date}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity className="px-2" onPress={onNextWeek}>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
}