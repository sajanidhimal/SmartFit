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
  const [timeToGoal, setTimeToGoal] = useState('');

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

    // Calculate calorie adjustment based on weight difference
    // 1kg of fat is roughly 7700 calories
    // Set a rate of weight change based on how much needs to be changed
    // Safe weight loss is typically 0.5-1kg per week (3500-7700 calorie deficit per week)
    // Safe weight gain is typically 0.25-0.5kg per week (1750-3500 calorie surplus per week)
    
    let weeklyRate = 0;
    let dailyCalories = 0;
    let weeksToGoal = 0;
    
    if (weightDiff > 0) {
      // Weight loss scenario
      // Cap at 1% of body weight per week for safety (or 1kg max)
      const safeWeeklyLoss = Math.min(currentWeightVal * 0.01, 1);
      // Adjust rate based on how much weight needs to be lost
      weeklyRate = Math.min(safeWeeklyLoss, Math.max(0.5, weightDiff / 12));
      
      // Calculate calorie deficit (7700 calories per kg)
      const dailyDeficit = Math.round((weeklyRate * 7700) / 7);
      
      // Ensure minimum healthy calories (never go below BMR * 1.2)
      const minHealthyCalories = Math.round(bmr * 1.2);
      dailyCalories = Math.max(minHealthyCalories, Math.round(tdee - dailyDeficit));
      
      // Calculate time to goal
      weeksToGoal = weightDiff / weeklyRate;
    } else if (weightDiff < 0) {
      // Weight gain scenario
      // Cap at 0.5% of body weight per week for healthy muscle gain
      const safeWeeklyGain = Math.min(currentWeightVal * 0.005, 0.5);
      weeklyRate = Math.min(safeWeeklyGain, Math.max(0.25, Math.abs(weightDiff) / 16));
      
      // Calculate calorie surplus (7700 calories per kg)
      const dailySurplus = Math.round((weeklyRate * 7700) / 7);
      dailyCalories = Math.round(tdee + dailySurplus);
      
      // Calculate time to goal
      weeksToGoal = Math.abs(weightDiff) / weeklyRate;
    } else {
      // Maintenance
      dailyCalories = Math.round(tdee);
      weeksToGoal = 0;
    }
    
    // Calculate and format time to goal
    if (weeksToGoal > 0) {
      const months = Math.floor(weeksToGoal / 4.33);
      const remainingWeeks = Math.round(weeksToGoal % 4.33);
      
      if (months > 0 && remainingWeeks > 0) {
        setTimeToGoal(`about ${months} month${months > 1 ? 's' : ''} and ${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}`);
      } else if (months > 0) {
        setTimeToGoal(`about ${months} month${months > 1 ? 's' : ''}`);
      } else {
        setTimeToGoal(`about ${remainingWeeks} week${remainingWeeks > 1 ? 's' : ''}`);
      }
    } else {
      setTimeToGoal('');
    }

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
            {timeToGoal && (
              <Text className="text-sm text-[#666] text-center mt-2">
                Estimated time to reach goal: {timeToGoal}
              </Text>
            )}
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