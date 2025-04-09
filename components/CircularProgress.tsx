import React from 'react';
import { View, Text } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number;
  max: number;
  value: number | string;
  unit: string;
  color: string;
}

export default function CircularProgress({
  size,
  strokeWidth,
  progress,
  max,
  value,
  unit,
  color = '#f8a100'
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const svgProgress = 100 - (progress / max) * 100;

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-90">
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e6e6e6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circum}
          strokeDashoffset={circum * svgProgress / 100}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      
      <View className="absolute items-center justify-center">
        <Text className="text-3xl font-bold text-gray-800">{value}</Text>
        <Text className="text-sm text-gray-500">{unit}</Text>
      </View>
    </View>
  );
}