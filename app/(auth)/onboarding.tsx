import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TargetWeightScreen from './target_weight';
import { Ionicons } from '@expo/vector-icons';


type HealthConcern = 'Diabetes' | 'Hypertension' | 'Heart Disease' | 'Asthma' | 'Obesity' | 'Anemia' | 'Joint Pain' | 'Anxiety' | 'Back Pain' | 'Muscle Cramps' | 'Postural Issues' | 'Tendonitis' | 'Depression' | 'None';

const HEALTH_CONCERNS: HealthConcern[] = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Obesity', 'Anemia',
  'Joint Pain', 'Anxiety', 'Back Pain', 'Muscle Cramps', 'Postural Issues',
  'Tendonitis', 'Depression', 'None'
];

type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very active';

const ACTIVITY_LEVELS: { level: ActivityLevel; desc: string }[] = [
  { level: 'Sedentary', desc: 'Mostly sitting throughout the day (e.g., desk job, bank teller, remote work)' },
  { level: 'Light', desc: 'Mostly standing throughout the day (e.g., sales associate, teacher)' },
  { level: 'Moderate', desc: 'Regular physical activity (e.g., walking, light workouts, or recreational sports)' },
  { level: 'Active', desc: 'Frequent physical activity (e.g., manual labor, intense workouts, or sports practice)' },
  { level: 'Very active', desc: 'Very intense activity or exercise (e.g., gym trainer, athlete, heavy physical work)' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [heightCm, setHeightCm] = useState<string>(''); // Store height in cm
  const [heightFeet, setHeightFeet] = useState<string>('5'); // UI display - feet
  const [heightInches, setHeightInches] = useState<string>(''); // UI display - inches
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(5); // Default to 5 as shown in the image
  const [healthConcerns, setHealthConcerns] = useState<HealthConcern[]>([]);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number | null>(null);
  const [bmrValue, setBmrValue] = useState<number | null>(null);
  
  // Function to convert feet/inches to cm
  const feetInchesToCm = (feet: string, inches: string): string => {
    const feetValue = parseInt(feet) || 0;
    const inchesValue = parseInt(inches) || 0;
    const totalInches = (feetValue * 12) + inchesValue;
    const cm = Math.round(totalInches * 2.54);
    return cm.toString();
  };

  // Update cm value when feet or inches change
  const updateHeightCm = (feet: string, inches: string) => {
    const newHeightCm = feetInchesToCm(feet, inches);
    setHeightCm(newHeightCm);
  };

  const handleFeetChange = (value: string) => {
    setHeightFeet(value);
    updateHeightCm(value, heightInches);
  };

  const handleInchesChange = (value: string) => {
    setHeightInches(value);
    updateHeightCm(heightFeet, value);
  };
  
  const handleGenderSelect = (selected: 'Male' | 'Female') => {
    if (name) {
      setGender(selected);
      nextStep();
    } else {
      Alert.alert('Please enter your name');
    }
  };
  
  const calculateBMI = () => {
    if (heightCm && weight) {
      const heightInMeters = parseFloat(heightCm) / 100;
      const weightInKg = parseFloat(weight);
      const calculatedBMI = weightInKg / (heightInMeters * heightInMeters);
      setBmi(parseFloat(calculatedBMI.toFixed(1))); // Store as number
    }
  };
  
  const nextStep = () => {
    if (step === 3) {
      calculateBMI();
    }
    setStep(step + 1);
  };
  
  const saveUserProfile = async () => {
    const user = auth.currentUser;
    if (user && bmi) {
      try {
        await setDoc(doc(db, "userProfiles", user.uid), {
          name,
          gender,
          height: parseFloat(heightCm),
          weight: parseFloat(weight),
          age: parseInt(age),
          bmi,
          activityLevel,
          targetWeight: parseFloat(targetWeight),
          dailyCalorieGoal,
          workoutFrequency,
          healthConcerns,
          createdAt: new Date()
        });
        const userDoc = await getDoc(doc(db, "userProfiles", user.uid));

        await AsyncStorage.setItem(
          `userProfile_${user.uid}`, 
          JSON.stringify(userDoc.data())
        );
        // Mark onboarding as complete
        await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
        router.replace('/(app)/home');
      } catch (error) {
        console.error("Error saving user profile:", error);
        alert("Failed to save your profile. Please try again.");
      }
    }
  };
  
  const toggleHealthConcern = (concern: HealthConcern) => {
    if (healthConcerns.includes(concern)) {
      setHealthConcerns(healthConcerns.filter(item => item !== concern));
    } else {
      setHealthConcerns([...healthConcerns, concern]);
    }
  };

  // First, add this utility function for the scrolling selection
  const handleScroll = (event: any, setFunction: (value: string) => void, currentValues: string[]) => {
    const y = event.nativeEvent.contentOffset.y;
    const itemHeight = 60;
    const index = Math.round(y / itemHeight);
    
    if (index >= 0 && index < currentValues.length) {
      setFunction(currentValues[index]);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-xl font-bold mb-4">How do you identify?</Text>
            <Text className="text-gray-500 mb-8 text-center">This is used in making personalized results and plans for you.</Text>
            <View className="flex-row border border-gray-300 rounded-lg p-3 mb-4 items-center">
              <TextInput
                className="flex-1"
                placeholder="Name"
                value={name}
                onChangeText={setName}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity 
              onPress={() => handleGenderSelect('Male')}
              className={`border rounded-lg p-6 w-full mb-4 items-center ${gender === 'Male' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <View className="bg-blue-100 rounded-full p-4 mb-2">
                <Ionicons name="male" size={24} color="#3b82f6" />
              </View>
              <Text className="font-medium">Male</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleGenderSelect('Female')}
              className={`border rounded-lg p-6 w-full items-center ${gender === 'Female' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <View className="bg-blue-100 rounded-full p-4 mb-2">
                <Ionicons name="female" size={24} color="#3b82f6" />
              </View>
              <Text className="font-medium">Female</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 2:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">What's your height?</Text>
              <Text className="text-gray-500 mb-6">This is used in making personalized results and plan for you.</Text>
              
              <View className="items-center mb-8">
                <View className="flex-row">
                  {/* Feet Selector */}
                  <View className="w-1/3 items-center">
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 60 }}
                      style={{ height: 180 }}
                      onMomentumScrollEnd={(event) => {
                        const feet = ["3", "4", "5", "6", "7"];
                        handleScroll(event, handleFeetChange, feet);
                      }}
                    >
                      {["3", "4", "5", "6", "7"].map((ft) => (
                        <TouchableOpacity
                          key={`ft-${ft}`}
                          onPress={() => handleFeetChange(ft)}
                          style={{ height: 60, justifyContent: 'center' }}
                        >
                          <Text 
                            className={`text-xl ${heightFeet === ft ? 'text-orange-500 font-bold' : 'text-gray-400'}`}
                          >
                            {ft}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View 
                      className="absolute top-1/2 h-[60px] w-full border-t border-b border-gray-200"
                      style={{ transform: [{ translateY: -30 }] }}
                    />
                  </View>
                  
                  {/* Dot Separator */}
                  <View className="w-1/6 items-center justify-center">
                    <Text className="text-gray-400 text-2xl">.</Text>
                  </View>
                  
                  {/* Inches Selector */}
                  <View className="w-1/3 items-center">
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 60 }}
                      style={{ height: 180 }}
                      onMomentumScrollEnd={(event) => {
                        const inches = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
                        handleScroll(event, handleInchesChange, inches);
                      }}
                    >
                      {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"].map((inch) => (
                        <TouchableOpacity
                          key={`in-${inch}`}
                          onPress={() => handleInchesChange(inch)}
                          style={{ height: 60, justifyContent: 'center' }}
                        >
                          <Text 
                            className={`text-xl ${heightInches === inch ? 'text-orange-500 font-bold' : 'text-gray-400'}`}
                          >
                            {inch}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View 
                      className="absolute top-1/2 h-[60px] w-full border-t border-b border-gray-200"
                      style={{ transform: [{ translateY: -30 }] }}
                    />
                  </View>
                  
                  {/* Unit */}
                  <View className="w-1/6 items-center justify-center">
                    <Text className="text-orange-500 text-lg">ft</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
              disabled={!heightFeet}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 3:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">What's your Weight (in Kg)?</Text>
              <Text className="text-gray-500 mb-6">This is used in making personalized results and plan for you.</Text>
              
              <View className="items-center mb-8">
                <View className="items-center w-full">
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 60 }}
                    style={{ height: 180 }}
                    onMomentumScrollEnd={(event) => {
                      const weights = Array.from({ length: 100 }, (_, i) => (i + 40).toString());
                      handleScroll(event, setWeight, weights);
                    }}
                  >
                    {Array.from({ length: 100 }, (_, i) => (i + 40).toString()).map((kg) => (
                      <TouchableOpacity
                        key={`kg-${kg}`}
                        onPress={() => setWeight(kg)}
                        style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text 
                          className={`text-xl ${weight === kg ? 'text-orange-500 font-bold' : 'text-gray-400'}`}
                        >
                          {kg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View 
                    className="absolute top-1/2 h-[60px] w-full border-t border-b border-gray-200"
                    style={{ transform: [{ translateY: -30 }] }}
                  />
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
              disabled={!weight}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 4:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">What's your age?</Text>
              <Text className="text-gray-500 mb-6">This is used in making personalized results and plan for you.</Text>
              
              <View className="items-center mb-8">
                <View className="items-center w-full">
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 60 }}
                    style={{ height: 180 }}
                    onMomentumScrollEnd={(event) => {
                      const ages = Array.from({ length: 70 }, (_, i) => (i + 15).toString());
                      handleScroll(event, setAge, ages);
                    }}
                  >
                    {Array.from({ length: 70 }, (_, i) => (i + 15).toString()).map((ageNum) => (
                      <TouchableOpacity
                        key={`age-${ageNum}`}
                        onPress={() => setAge(ageNum)}
                        style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text 
                          className={`text-xl ${age === ageNum ? 'text-orange-500 font-bold' : 'text-gray-400'}`}
                        >
                          {ageNum}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View 
                    className="absolute top-1/2 h-[60px] w-full border-t border-b border-gray-200"
                    style={{ transform: [{ translateY: -30 }] }}
                  />
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
              disabled={!age}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 5:
        // Calculate BMI category
        const getBmiCategory = () => {
          if (!bmi) return { category: 'Normal', color: 'text-green-500' };
          
          if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-500' };
          if (bmi < 25) return { category: 'Normal', color: 'text-green-500' };
          if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-500' };
          return { category: 'Obese', color: 'text-red-500' };
        };
        
        const bmiCategory = getBmiCategory();
        
        // Calculate needle position (0-100%)
        const getNeedlePosition = () => {
          if (!bmi) return 50;
          if (bmi < 16) return 0;
          if (bmi > 35) return 100;
          
          // Map BMI range 16-35 to 0-100%
          return ((bmi - 16) / (35 - 16)) * 100;
        };
        
        const needlePosition = getNeedlePosition();
        
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-4">Your BMI Result is</Text>
              
              {/* BMI Gauge Visualization */}
              <View className="items-center mb-6">
                {/* Gauge */}
                <View className="relative w-full h-32 mb-4">
                  {/* Gauge background */}
                  <View className="absolute w-full h-16 overflow-hidden">
                    <View className="bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 h-full rounded-t-full" />
                  </View>
                  
                  {/* Needle */}
                  <View className="absolute w-full" style={{ top: 16 }}>
                    <View 
                      className="absolute h-16 flex flex-col items-center"
                      style={{ left: `${needlePosition}%`, marginLeft: -1 }}
                    >
                      <View className="h-14 w-[2px] bg-black" />
                      <View className="h-4 w-4 rounded-full bg-black mt-[-2px]" />
                    </View>
                  </View>
                  
                  {/* BMI Range markers */}
                  <View className="absolute w-full flex-row justify-between" style={{ top: 64 }}>
                    <Text className="text-xs text-blue-500">Underweight</Text>
                    <Text className="text-xs text-green-500">Normal</Text>
                    <Text className="text-xs text-yellow-500">Overweight</Text>
                    <Text className="text-xs text-red-500">Obese</Text>
                  </View>
                </View>
                
                <Text className="text-xl font-bold mb-1">BMI: {bmi?.toFixed(1)} kg/m²</Text>
                <Text className="text-sm text-gray-500 mb-3">{weight} kg | {gender} | {age} years old</Text>
                
                <View className="flex-row items-center justify-between w-full mb-6 bg-gray-100 rounded-lg p-4">
                  <View className="items-center">
                    <Text className="text-sm font-medium">Category</Text>
                    <Text className={`text-sm font-bold ${bmiCategory.color}`}>{bmiCategory.category}</Text>
                  </View>
                  
                  <View className="h-10 w-[1px] bg-gray-300" />
                  
                  <View className="items-center">
                    <Text className="text-sm font-medium">Healthy Range</Text>
                    <Text className="text-sm text-gray-700">55.9 kg - 75.2 kg</Text>
                  </View>
                </View>
                
                <Text className="text-sm text-gray-600 text-center mb-4">
                  {bmiCategory.category === 'Normal' 
                    ? "Great job! Your weight is in the normal range. Keep maintaining your healthy habits with a balanced diet and regular exercise to stay on track."
                    : "We'll help you reach a healthier weight with personalized diet and exercise recommendations."}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
            >
              <Text className="text-white font-semibold">Continue</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 6:
        return (
          <TargetWeightScreen
            currentWeight={parseFloat(weight)}
            height={heightCm}
            age={age}
            gender={gender}
            activityLevel={activityLevel}
            onNext={(targetWt, bmr, calories) => {
              setTargetWeight(targetWt);
              setBmrValue(bmr); 
              setDailyCalorieGoal(calories);
              nextStep();
            }}
          />
        );
        
      case 7:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">Set Your Step Goal</Text>
              <Text className="text-gray-500 mb-6">This is used in making personalized results and plan for you.</Text>
              
              <View className="items-center mb-8">
                <View className="items-center w-full">
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 60 }}
                    style={{ height: 180 }}
                    onMomentumScrollEnd={(event) => {
                      const steps = Array.from({ length: 10 }, (_, i) => ((i + 3) * 1000).toString());
                      handleScroll(event, setTargetWeight, steps);
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => ((i + 3) * 1000).toString()).map((steps) => (
                      <TouchableOpacity
                        key={`steps-${steps}`}
                        onPress={() => setTargetWeight(steps)}
                        style={{ height: 60, justifyContent: 'center', alignItems: 'center' }}
                      >
                        <Text 
                          className={`text-xl ${targetWeight === steps ? 'text-orange-500 font-bold' : 'text-gray-400'}`}
                        >
                          {steps} <Text className="text-sm text-gray-400">steps</Text>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View 
                    className="absolute top-1/2 h-[60px] w-full border-t border-b border-gray-200"
                    style={{ transform: [{ translateY: -30 }] }}
                  />
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
              disabled={!targetWeight}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 8:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">How Active You Are?</Text>
              <Text className="text-gray-500 mb-6">Based on your lifestyle, we can suggest your daily calorie requirements.</Text>
              
              <ScrollView className="mb-6">
                {ACTIVITY_LEVELS.map((item) => (
                  <TouchableOpacity
                    key={item.level}
                    onPress={() => setActivityLevel(item.level)}
                    className={`border rounded-lg p-4 mb-4 ${activityLevel === item.level ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}
                  >
                    <Text className="font-bold mb-1">{item.level}</Text>
                    <Text className="text-gray-600 text-sm">{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
              disabled={!activityLevel}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 9:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">How fast do you want to reach your goal?</Text>
              <Text className="text-gray-500 mb-6">This is a good pace, but you would need to work a bit harder.</Text>
              
              <View className="items-center mb-6">
                <Text className="text-2xl font-bold mb-2">0.75 kg</Text>
                <Text className="text-gray-500">per week</Text>
                
                <View className="w-full flex-row items-center justify-between mt-6">
                  <Text className="text-gray-500">Less</Text>
                  <View className="h-2 bg-gray-200 rounded-full flex-1 mx-4">
                    <View className="h-2 bg-orange-400 rounded-full" style={{ width: '50%' }} />
                  </View>
                  <Text className="text-gray-500">More</Text>
                </View>
                
                <Text className="mt-6 text-orange-500">You will reach your goal in 7 weeks.</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 10:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-4">How often would you like to work out?</Text>
              <Text className="text-sm text-gray-500 mb-4">I enjoy working out as a part of my lifestyle.</Text>
              
              <View className="items-center mb-6">
                <Text className="text-4xl font-bold mb-2">{workoutFrequency}</Text>
                <Text className="text-gray-500">times/week</Text>
                
                <View className="w-full flex-row items-center justify-between mt-6">
                  <Text className="text-gray-500">Less</Text>
                  <View className="h-2 bg-gray-200 rounded-full flex-1 mx-4">
                    <View 
                      className="h-2 bg-orange-400 rounded-full" 
                      style={{ width: `${(workoutFrequency / 7) * 100}%` }} 
                    />
                  </View>
                  <Text className="text-gray-500">More</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <TouchableOpacity 
                    key={num}
                    onPress={() => setWorkoutFrequency(num)}
                    className={`w-10 h-10 rounded-full items-center justify-center ${workoutFrequency === num ? 'bg-orange-400' : 'bg-gray-200'}`}
                  >
                    <Text className={workoutFrequency === num ? 'text-white' : 'text-gray-700'}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 11:
        return (
          <View className="flex-1 justify-center p-6 bg-gray-100">
            <View className="bg-white rounded-xl p-6">
              <Text className="text-xl font-bold mb-2">Select Any Health Concerns</Text>
              <Text className="text-gray-500 mb-6">Select any discomforts or health conditions that may affect your exercise or diet.</Text>
              
              <View className="flex-row flex-wrap justify-between mb-6">
                {HEALTH_CONCERNS.map((concern) => (
                  <TouchableOpacity
                    key={concern}
                    onPress={() => toggleHealthConcern(concern)}
                    className={`border rounded-full py-2 px-4 mb-4 ${healthConcerns.includes(concern) ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                  >
                    <Text className={healthConcerns.includes(concern) ? 'text-orange-400' : 'text-gray-700'}>{concern}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center mt-6"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        case 12:
  // Calculate BMR based on user data

  
  // Calculate daily calories based on BMR and activity level


  
  // Calculate macronutrients
  const calculateMacros = (calories: number) => {
    // Protein: 30%, Carbs: 50%, Fat: 20%
    const protein = (calories * 0.3) / 4; // 4 calories per gram of protein
    const carbs = (calories * 0.5) / 4;   // 4 calories per gram of carbs
    const fat = (calories * 0.2) / 9;     // 9 calories per gram of fat
    
    return {
      protein: protein.toFixed(2),
      carbs: carbs.toFixed(2),
      fat: fat.toFixed(2)
    };
  };
  
  const macros = calculateMacros(dailyCalorieGoal!);
  
  // Update state with calculated values

  
  return (
    <View className="flex-1 justify-center p-6 bg-gray-100">
      <View className="bg-white rounded-xl p-6">
        <Text className="text-3xl font-bold text-orange-400 mb-4">Your BMR Calculation</Text>
        
        <Text className="text-gray-600 mb-6 text-center">
          Your Basal Metabolic Rate (BMR) is the number of calories your body needs for basic functions like 
          breathing and digestion, calculated using your age, gender, weight, and height.
        </Text>
        
        <View className="bg-gray-100 rounded-lg p-4 mb-6">
          <Text className="text-xl text-center text-orange-400 font-medium">
            Your BMR is: {bmrValue!.toFixed(2)} calories/day
          </Text>
        </View>
        
        <Text className="text-2xl font-bold text-gray-700 mb-2">Estimated Daily Calorie Intake</Text>
        <Text className="text-gray-600 mb-4 text-center">
          Based on your activity level, here is the breakdown of your daily calories and macronutrients
        </Text>
        
        <View className="items-center mb-6">
          <Text className="text-4xl font-bold text-orange-400">
            {dailyCalorieGoal}
          </Text>
          <Text className="text-gray-500">calories/day</Text>
        </View>
        
        <View className="flex-row justify-between mb-6">
          <View className="bg-white rounded-lg p-4 shadow w-[30%] items-center">
            <Text className="font-bold text-gray-700">Protein</Text>
            <Text className="text-orange-400 font-bold">{macros.protein} g</Text>
            <Text className="text-xs text-gray-500 text-center mt-2">
              Protein is essential for muscle growth and repair.
            </Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow w-[30%] items-center">
            <Text className="font-bold text-gray-700">Carbs</Text>
            <Text className="text-orange-400 font-bold">{macros.carbs} g</Text>
            <Text className="text-xs text-gray-500 text-center mt-2">
              Carbohydrates provide energy for your body and brain.
            </Text>
          </View>
          
          <View className="bg-white rounded-lg p-4 shadow w-[30%] items-center">
            <Text className="font-bold text-gray-700">Fat</Text>
            <Text className="text-orange-400 font-bold">{macros.fat} g</Text>
            <Text className="text-xs text-gray-500 text-center mt-2">
              Fats help absorb vitamins and provide long-term energy.
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        onPress={nextStep}
        className="bg-orange-400 p-4 rounded-lg items-center mt-6"
      >
        <Text className="text-white font-semibold">Submit</Text>
      </TouchableOpacity>
    </View>
  );

// For the Congratulations Screen (case 13)
case 13:
  return (
    <View className="flex-1 justify-center p-6 bg-gray-100">
      <View className="bg-white rounded-xl p-6 items-center">
        {/* Celebration icon/animation */}
        <View className="mb-8">
          {/* This is a simplified version of the fireworks/celebration in your mockup */}
          <View className="w-32 h-32 items-center justify-center">
            <Ionicons name="star" size={48} color="#F5A623" />
            <View className="absolute top-0 right-0">
              <Ionicons name="star" size={24} color="#F5A623" />
            </View>
            <View className="absolute bottom-0 left-0">
              <Ionicons name="star" size={16} color="#F5A623" />
            </View>
            <View className="absolute top-2 left-2">
              <Ionicons name="star" size={20} color="#F5A623" />
            </View>
          </View>
        </View>
        
        <Text className="text-4xl font-bold text-purple-600 mb-6">Congratulations!</Text>
        
        <Text className="text-xl text-center text-gray-600 mb-8">
          You're on your journey to better health! Enjoy every step as you work towards your goals.
        </Text>
        
        <TouchableOpacity 
          onPress={saveUserProfile}
          className="bg-orange-400 p-4 rounded-lg items-center w-full mb-4"
        >
          <Text className="text-white font-semibold">Continue</Text>
        </TouchableOpacity>
        
        <Text className="text-gray-400 text-center">Let's make every meal count!</Text>
      </View>
    </View>
  );
    }
  };
  
  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-4">
        <TouchableOpacity className="bg-orange-400 rounded-full w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {renderStep()}
    </View>
  );
}