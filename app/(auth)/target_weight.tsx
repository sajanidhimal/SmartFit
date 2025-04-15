import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';

export default function TargetWeightScreen({
  currentWeight,
  height,
  age,
  gender,
  activityLevel,
  onNext,
}: {
  currentWeight: number;
  height: string;
  age: string;
  gender: string;
  activityLevel: string;
  onNext: (targetWeight: string, bmr: number, targetCalories: number) => void;
}) {
  const [targetWeight, setTargetWeight] = useState('');
  const [targetCalories, setTargetCalories] = useState(0);
  const [weightChange, setWeightChange] = useState(0);
  const [percentChange, setPercentChange] = useState(0);

  const calculateBMR = () => {
    const weightInKg = Number(currentWeight);
    const heightInCm = Number(height);
    const ageYears = Number(age);

    if (isNaN(weightInKg) || isNaN(heightInCm) || isNaN(ageYears) || weightInKg <= 0 || heightInCm <= 0 || ageYears <= 0) {
      return 0;
    }

    return gender === 'Male'
      ? 10 * weightInKg + 6.25 * heightInCm - 5 * ageYears + 5
      : 10 * weightInKg + 6.25 * heightInCm - 5 * ageYears - 161;
  };

  const calculateTDEE = (bmr: number) => {
    if (bmr <= 0) return 0;
    const activityMultipliers: { [key: string]: number } = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
      'Very active': 1.9,
    };
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    return bmr * multiplier;
  };

  const calculateDailyCalories = () => {
    if (!targetWeight || targetWeight.trim() === '') return;

    const targetWeightNum = Number(targetWeight);
    const currentWeightVal = Number(currentWeight);

    if (isNaN(targetWeightNum) || targetWeightNum <= 0 || isNaN(currentWeightVal) || currentWeightVal <= 0) return;

    const weightDiff = currentWeightVal - targetWeightNum;
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);

    const changePercent = (Math.abs(weightDiff) / currentWeightVal) * 100;
    setPercentChange(parseFloat(changePercent.toFixed(1)));
    setWeightChange(parseFloat(weightDiff.toFixed(1)));

    let calorieAdjustment = weightDiff > 0 ? -500 : weightDiff < 0 ? 500 : 0;
    const dailyCalories = Math.round(tdee + calorieAdjustment);

    if (!isNaN(dailyCalories) && dailyCalories > 0) {
      setTargetCalories(dailyCalories);
    } else {
      setTargetCalories(0);
    }
  };

  const calculateIdealWeightRange = () => {
    const heightInM = Number(height) / 100;
    if (isNaN(heightInM) || heightInM <= 0) return { lowerWeight: '0.0', upperWeight: '0.0' };
    return {
      lowerWeight: (18.5 * heightInM * heightInM).toFixed(1),
      upperWeight: (24.9 * heightInM * heightInM).toFixed(1),
    };
  };

  useEffect(() => {
    calculateDailyCalories();
  }, [targetWeight]);

  const { lowerWeight, upperWeight } = calculateIdealWeightRange();

  const showResults =
    targetWeight && targetWeight.trim() !== '' && !isNaN(Number(targetWeight)) && targetCalories > 0;

  return (
    <View className="flex-1 bg-[#f5f7fb] px-4 items-center">
      <SafeAreaView className="w-full bg-[#e6f3fd] rounded-lg p-4 mt-4 mb-6">
        <View className="flex-row items-center">
          <Text className="text-[#f8a427] text-2xl mr-2">ⓘ</Text>
          <Text className="text-[#4a4a4a] text-base">
            According to your BMI, your ideal weight is between{' '}
            <Text className="text-[#f8a427] font-bold">{lowerWeight} - {upperWeight} kg</Text>.
          </Text>
        </View>
      </SafeAreaView>

      <View className="my-6">
        <View className="w-[70px] h-[70px] rounded-full bg-[#f8a427] justify-center items-center">
          <View className="w-[50px] h-[50px] rounded-full bg-[#f9b95a] justify-center items-center">
            <View className="w-[30px] h-[30px] rounded-full bg-[#fad08d]" />
          </View>
        </View>
      </View>

      <Text className="text-2xl font-bold text-center text-[#333] mb-2">What is Your Target Weight?</Text>
      <Text className="text-base text-center text-[#666] mb-8">We use this information to calculate your daily goal.</Text>

      <View className="flex-row items-center justify-center w-full mb-8">
        <Text className="text-4xl text-[#ccc] font-bold w-20 text-center">{currentWeight}</Text>
        <Text className="text-2xl text-[#f8a427] mx-4">&gt;&gt;</Text>
        <TextInput
          className="text-4xl font-bold text-[#f8a427] border-b-2 border-[#f8a427] w-20 text-center pb-2"
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
          placeholder="60"
          placeholderTextColor="#ccc"
        />
      </View>

      {showResults && (
        <View className="w-full mb-8">
          <View className="bg-white rounded-lg p-4 items-center mb-4 shadow-sm">
            <Text className="text-lg text-[#333] font-bold mb-2">Daily Calorie Goal</Text>
            <Text className="text-3xl text-[#f8a427] font-bold mb-2">{targetCalories} kcal</Text>
            <Text className="text-sm text-[#666] text-center">
              {weightChange > 0
                ? `For weight loss of ${weightChange} kg (${percentChange}%)`
                : weightChange < 0
                ? `For weight gain of ${Math.abs(weightChange)} kg (${percentChange}%)`
                : 'For weight maintenance'}
            </Text>
          </View>

          <View className="bg-white rounded-lg p-4 items-center shadow-sm">
            <View className="w-8 h-8 rounded-full bg-[#f8a427] mb-2" />
            <Text className="text-lg text-[#f8a427] font-bold mb-2">Sweaty Choice</Text>
            <Text className="text-sm text-[#666] text-center">
              You will {weightChange > 0 ? 'lose' : 'gain'} {percentChange}% of body weight and enjoy continuous health benefits.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        className={`w-full rounded-lg p-4 items-center ${
          !showResults ? 'bg-[#f8c980]' : 'bg-[#f8a427]'
        }`}
        onPress={() => onNext(targetWeight, calculateBMR(), targetCalories)}
        disabled={!showResults}
      >
        <Text className="text-white text-base font-bold">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
