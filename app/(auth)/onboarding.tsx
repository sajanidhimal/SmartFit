import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TargetWeightScreen from './target_weight';


type HealthConcern = 'Diabetes' | 'Hypertension' | 'Heart Disease' | 'Asthma' | 'None';

const HEALTH_CONCERNS: HealthConcern[] = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'];


type ActivityLevel = 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very active';

                    // Update your activity level options to use the type
const activityLevelOptions: { level: ActivityLevel; desc: string }[] = [
                      { level: 'Sedentary', desc: 'Mostly sitting throughout the day...' },
                      { level: 'Light', desc: 'Mostly standing throughout the day...' },
                      { level: 'Moderate', desc: 'Regular physical activity...' },
                      { level: 'Active', desc: 'Frequent physical activity...' },
                      { level: 'Very active', desc: 'Very intense activity or exercise...' },
     ];

    const ACTIVITY_LEVELS: { level: ActivityLevel; desc: string }[] = [
      { level: 'Sedentary', desc: 'Little or no physical activity' },
      { level: 'Light', desc: 'Light exercise or sports 1-3 days/week' },
      { level: 'Moderate', desc: 'Moderate exercise or sports 3-5 days/week' },
      { level: 'Active', desc: 'Hard exercise or sports 6-7 days/week' },
      { level: 'Very active', desc: 'Very hard exercise, physical job, or training twice a day' },
    ];
      



export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [workoutFrequency, setWorkoutFrequency] = useState<number>(0);
  const [healthConcerns, setHealthConcerns] = useState<HealthConcern[]>([]);

  const [dailyCalorieGoal, setDailyCalorieGoal] = useState<number | null>(null);

  
  const handleGenderSelect = (selected: 'Male' | 'Female') => {
    setGender(selected);
    nextStep();
  };
  
  const calculateBMI = () => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
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
            gender,
            height: parseFloat(height),
            weight: parseFloat(weight),
            age: bmi,
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
  const renderStep =() => {
    switch(step) {
      case 1:
        return (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-xl font-bold mb-4">How do you identify?</Text>
            <Text className="text-gray-500 mb-8 text-center">This is used in making personalized results and plans for you.</Text>
            
            <TouchableOpacity 
              onPress={() => handleGenderSelect('Male')}
              className={`border rounded-lg p-6 w-full mb-4 items-center ${gender === 'Male' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <View className="bg-blue-100 rounded-full p-4 mb-2">
                {/* Icon placeholder */}
              </View>
              <Text className="font-medium">Male</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleGenderSelect('Female')}
              className={`border rounded-lg p-6 w-full items-center ${gender === 'Female' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <View className="bg-blue-100 rounded-full p-4 mb-2">
                {/* Icon placeholder */}
              </View>
              <Text className="font-medium">Female</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 2:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">What's your height?</Text>
            <Text className="text-gray-500 mb-8">This is used in making personalized results and plans for you.</Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-8"
              placeholder="Height in cm"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
              disabled={!height}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 3:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">What's your Weight (in Kg)?</Text>
            <Text className="text-gray-500 mb-8">This is used in making personalized results and plans for you.</Text>
            
            <TextInput
              className="border border-gray-300 rounded-lg p-4 mb-8"
              placeholder="Weight in kg"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
              disabled={!weight}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 4:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">What's your age?</Text>
            <Text className="text-gray-500 mb-8">This is used in making personalized results and plans for you.</Text>
            
            <View className="flex-row flex-wrap justify-between mb-8">
              {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((num) => (
                <TouchableOpacity 
                  key={num}
                  onPress={() => setAge(num.toString())}
                  className={`border w-16 h-16 rounded-lg items-center justify-center mb-4 ${age === num.toString() ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                >
                  <Text className={`text-lg ${age === num.toString() ? 'text-orange-400' : 'text-gray-700'}`}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
              disabled={!age}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
        case 5:
            return (
              <View className="flex-1 justify-center p-6">
                <Text className="text-xl font-bold mb-4">Your BMI Result is</Text>
                
                <View className="w-full items-center mb-6">
                  <View className="bg-yellow-100 rounded-full w-24 h-24 items-center justify-center mb-4">
                    <Text className="text-2xl font-bold">{bmi?.toFixed(1)}</Text>
                    <Text className="text-sm">kg/m²</Text>
                  </View>
                  
                  <Text className="text-lg mb-2">BMI: {bmi?.toFixed(1)} kg/m²</Text>
                  {bmi !== null && (
                    <>
                      <Text className="text-gray-500 text-center mb-4">
                        {bmi < 18.5 ? 'Underweight' : 
                         bmi < 25 ? 'Normal' : 
                         bmi < 30 ? 'Overweight' : 'Obese'}
                      </Text>
                      
                      <Text className="text-gray-600 text-center mb-8">
                        {bmi >= 18.5 && bmi < 25 
                          ? 'Great job! Your weight is in the normal range...'
                          : 'Your BMI suggests you may benefit from some changes...'}
                      </Text>
                    </>
                  )}
                </View>
                
                <TouchableOpacity 
                  onPress={nextStep}
                  className="bg-orange-400 p-4 rounded-lg items-center"
                >
                  <Text className="text-white font-semibold">Continue</Text>
                </TouchableOpacity>
              </View>
            );
            case 6:
              return (
                <TargetWeightScreen
                  currentWeight={parseFloat(weight)}
                  height={height}
                  age={age}
                  gender={gender}
                  activityLevel={activityLevel}
                  onNext={(targetWt, calories) => {
                    setTargetWeight(targetWt);
                    setDailyCalorieGoal(calories);
                    nextStep();
                  }}
                />
              );
      case 7:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">Set Your Step Goal</Text>
            <Text className="text-gray-500 mb-8">This is used in making personalized results and plans for you.</Text>
            
            <View className="w-full mb-8">
              {['5000', '6000', '7000', '8000', '10000'].map((steps) => (
                <TouchableOpacity 
                  key={steps}
                  onPress={() => setTargetWeight(steps)}
                  className={`border border-gray-300 rounded-lg p-4 mb-4 ${targetWeight === steps ? 'border-orange-400 bg-orange-50' : ''}`}
                >
                  <Text className={`text-center ${targetWeight === steps ? 'text-orange-400 font-bold' : ''}`}>{steps} steps</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
              disabled={!targetWeight}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 8:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">How Active You Are?</Text>
            <Text className="text-gray-500 mb-8">Based on your lifestyle, we can suggest your daily calorie requirements.</Text>
            
            <ScrollView className="mb-8">
              
                {ACTIVITY_LEVELS.map((item) => (
                    <TouchableOpacity
                      key={item.level}
                      onPress={() => setActivityLevel(item.level)}
                  className={`border rounded-lg p-4 mb-4 ${activityLevel === item.level ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                >
                  <Text className="font-bold mb-1">{item.level}</Text>
                  <Text className="text-gray-600 text-sm">{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
              disabled={!activityLevel}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 9:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">How fast do you want to reach your goal?</Text>
            <Text className="text-gray-500 mb-8">This is a good pace, but you would need to work a bit harder.</Text>
            
            <View className="items-center mb-8">
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
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 10:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">How often would you like to work out?</Text>
            
            <View className="items-center mb-8">
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
            
            <View className="flex-row justify-between mb-8">
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
            
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-orange-400 p-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 11:
        return (
          <View className="flex-1 justify-center p-6">
            <Text className="text-xl font-bold mb-4">Select Any Health Concerns</Text>
            <Text className="text-gray-500 mb-8">Select any discomforts or health conditions that may affect your exercise or diet.</Text>
            
            <View className="flex-row flex-wrap justify-between mb-8">
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
            
            <TouchableOpacity 
              onPress={saveUserProfile}
              className="bg-orange-400 p-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };
  
  return (
    <View className="flex-1 bg-white">
      {renderStep()}
    </View>
  );
}