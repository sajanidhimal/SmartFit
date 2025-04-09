
import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

interface MacroCardProps {
  title: string;
  current: number;
  goal: number;
  unit: string;
  bgColor: string;
  progressColor: string;
  textColor: string;
}

export default function MacroCard({
  title,
  current,
  goal,
  unit,
  bgColor,
  progressColor,
  textColor
}: MacroCardProps) {
  const size = 40;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const svgProgress = 100 - (current / goal) * 100;

  return (
    <View className={`flex-1 p-4 rounded-lg items-center ${bgColor}`}>
      <View className="items-center justify-center mb-2">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-90">
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circum}
            strokeDashoffset={circum * svgProgress / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>
      </View>
      
      <Text className={`font-semibold text-base ${textColor}`}>{title}</Text>
      <Text className={`text-sm ${textColor}`}>
        {current}/{goal} {unit}
      </Text>
    </View>
  );
}