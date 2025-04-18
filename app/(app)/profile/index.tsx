import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  Alert, 
  Modal,
  ScrollView,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '@/app/firebase';
import { getUserProfile, updateUserProfile } from '@/app/utils/database_service/profile_functions';

// Extended profile interface to include all properties we need
interface ExtendedUserProfile {
  name?: string;
  gender: string;
  height: number | string;
  weight: number | string;
  age: number | string;
  activityLevel: string;
  targetWeight: number | string;
  workoutFrequency?: string;
  healthConcerns?: string;
  bmi?: number | string;
  dailyCalorieGoal?: number | string;
  weightChangePerWeek?: string;
  goalAchieveDate?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    gender: '',
    height: '',
    weight: '',
    age: '',
    activityLevel: '',
    targetWeight: '',
    bmi: '',
    weightChange: '',
    goal: '',
    weightChangePerWeek: '',
    goalAchieveDate: '',
    calorieIntake: '',
    protein: ''
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<{
    key: string;
    label: string;
    value: string;
    unit?: string;
    inputType?: 'text' | 'numeric' | 'select';
    options?: string[];
  } | null>(null);
  
  // Load user data when the component mounts
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('User not logged in');
        router.replace('/(auth)/login');
        return;
      }
      
      const profileResult = await getUserProfile(userId);
      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data as ExtendedUserProfile;
        
        // Calculate weight change and goal
        const currentWeight = parseFloat(String(profile.weight));
        const targetWeight = parseFloat(String(profile.targetWeight));
        const weightDiff = Math.abs(currentWeight - targetWeight);
        const goalType = currentWeight > targetWeight ? 'lose' : 'gain';
        
        // Calculate BMI
        const heightInMeters = parseFloat(String(profile.height)) / 100;
        const bmi = currentWeight / (heightInMeters * heightInMeters);
        
        // Calculate daily calorie goal based on mifflin-st jeor formula
        const bmr = calculateBMR(
          profile.gender, 
          parseFloat(String(profile.weight)), 
          parseFloat(String(profile.height)), 
          parseFloat(String(profile.age))
        );
        
        const tdee = calculateTDEE(bmr, profile.activityLevel);
        const dailyCalories = calculateDailyCalories(
          parseFloat(String(profile.weight)),
          parseFloat(String(profile.targetWeight)),
          bmr,
          tdee
        );
        
        // Format data
        setUserData({
          name: profile.name || '',
          gender: profile.gender || '',
          height: profile.height?.toString() || '',
          weight: profile.weight?.toString() || '',
          age: profile.age?.toString() || '',
          activityLevel: profile.activityLevel || '',
          targetWeight: profile.targetWeight?.toString() || '',
          bmi: profile.bmi?.toString() || bmi.toFixed(1),
          weightChange: weightDiff.toString(),
          goal: goalType,
          weightChangePerWeek: profile.weightChangePerWeek || '0.75 kg',
          goalAchieveDate: profile.goalAchieveDate || 'Jan 25, 2025',
          calorieIntake: profile.dailyCalorieGoal?.toString() || dailyCalories.toString(),
          protein: Math.round(parseFloat(dailyCalories.toString()) * 0.3 / 4).toString() + ' g'
        });
      } else {
        Alert.alert('Error', 'Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'An error occurred while loading your profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateBMR = (gender: string, weight: number, height: number, age: number) => {
    if (isNaN(weight) || isNaN(height) || isNaN(age) || weight <= 0 || height <= 0 || age <= 0) {
      return 0;
    }

    // Mifflin-St Jeor Equation
    return gender === 'Male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  };

  const calculateTDEE = (bmr: number, activityLevel: string) => {
    if (bmr <= 0) return 0;
    const activityMultipliers: { [key: string]: number } = {
      'Sedentary': 1.2,
      'Light': 1.375,
      'Moderate': 1.55,
      'Active': 1.725,
      'Very Active': 1.9,
    };
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    return bmr * multiplier;
  };

  const calculateDailyCalories = (currentWeight: number, targetWeight: number, bmr: number, tdee: number) => {
    const weightDiff = currentWeight - targetWeight;
    
    let weeklyRate = 0;
    let dailyCalories = 0;
    
    if (weightDiff > 0) {
      // Weight loss scenario
      const safeWeeklyLoss = Math.min(currentWeight * 0.01, 1);
      
      // As current weight approaches target weight, reduce the weekly loss rate
      // This ensures calorie deficit decreases as you get closer to your goal
      const remainingLossPercentage = weightDiff / (currentWeight * 0.2); // Scale based on % of initial weight difference
      weeklyRate = Math.min(safeWeeklyLoss, Math.max(0.2, safeWeeklyLoss * remainingLossPercentage));
      
      // Calculate calorie deficit (7700 calories per kg)
      const dailyDeficit = Math.round((weeklyRate * 7700) / 7);
      
      // Ensure minimum healthy calories
      const minHealthyCalories = Math.round(bmr * 1.2);
      dailyCalories = Math.max(minHealthyCalories, Math.round(tdee - dailyDeficit));
    } else if (weightDiff < 0) {
      // Weight gain scenario
      const safeWeeklyGain = Math.min(currentWeight * 0.005, 0.5);
      weeklyRate = Math.min(safeWeeklyGain, Math.max(0.25, Math.abs(weightDiff) / 16));
      
      // Calculate calorie surplus
      const dailySurplus = Math.round((weeklyRate * 7700) / 7);
      dailyCalories = Math.round(tdee + dailySurplus);
    } else {
      // Maintenance
      dailyCalories = Math.round(tdee);
    }
    
    return Math.round(dailyCalories);
  };
  
  const calculateBMIValue = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const openEditModal = (key: string, label: string, value: string, unit?: string, inputType?: 'text' | 'numeric' | 'select', options?: string[]) => {
    setEditItem({ key, label, value, unit, inputType: inputType || 'text', options });
    setModalVisible(true);
  };
  
  const handleSaveEdit = async () => {
    if (!editItem) return;
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      // Create update data object with the edited field
      const updateData: any = {};
      updateData[editItem.key] = editItem.value;
      
      // Update in Firestore
      const result = await updateUserProfile(userId, updateData);
      
      if (result.success) {
        // Update local state with new value
        setUserData(prev => ({
          ...prev,
          [editItem.key]: editItem.value
        }));
        
        // Recalculate derived values if weight, height, target weight, or age changed
        if (['weight', 'height', 'targetWeight', 'age', 'gender', 'activityLevel'].includes(editItem.key)) {
          const newUserData = { ...userData, [editItem.key]: editItem.value };
          
          // Recalculate BMI if weight or height changed
          if (editItem.key === 'weight' || editItem.key === 'height' || editItem.key === 'gender') {
            const weight = parseFloat(editItem.key === 'weight' ? editItem.value : newUserData.weight);
            const height = parseFloat(editItem.key === 'height' ? editItem.value : newUserData.height);
            
            if (!isNaN(weight) && !isNaN(height) && weight > 0 && height > 0) {
              const newBmi = calculateBMIValue(weight, height);
              setUserData(prev => ({
                ...prev,
                [editItem.key]: editItem.value,
                bmi: newBmi.toFixed(1)
              }));
              
              // Update in Firestore
              await updateUserProfile(userId, { bmi: newBmi.toFixed(1) });
            }
          }
          
          // Always recalculate calorie goal and protein if any of the relevant fields change
          const weight = parseFloat(editItem.key === 'weight' ? editItem.value : newUserData.weight);
          const targetWeight = parseFloat(editItem.key === 'targetWeight' ? editItem.value : newUserData.targetWeight);
          const height = parseFloat(editItem.key === 'height' ? editItem.value : newUserData.height);
          const age = parseFloat(editItem.key === 'age' ? editItem.value : newUserData.age);
          const gender = editItem.key === 'gender' ? editItem.value : newUserData.gender;
          const activityLevel = editItem.key === 'activityLevel' ? editItem.value : newUserData.activityLevel;
          
          if (!isNaN(weight) && !isNaN(targetWeight) && !isNaN(height) && !isNaN(age) && 
              weight > 0 && height > 0 && age > 0) {
            // Calculate weight change and goal
            const weightDiff = Math.abs(weight - targetWeight);
            const goalType = weight > targetWeight ? 'lose' : 'gain';
            
            const bmr = calculateBMR(gender, weight, height, age);
            const tdee = calculateTDEE(bmr, activityLevel);
            const newDailyCalories = calculateDailyCalories(weight, targetWeight, bmr, tdee);
            const newProtein = Math.round(newDailyCalories * 0.3 / 4); // 30% of calories from protein, 4 calories per gram
            
            setUserData(prev => ({
              ...prev,
              [editItem.key]: editItem.value,
              calorieIntake: newDailyCalories.toString(),
              protein: newProtein.toString() + ' g',
              weightChange: weightDiff.toString(),
              goal: goalType,
              bmi: prev.bmi // preserve updated BMI if it was changed
            }));
            
            // Update in Firestore
            await updateUserProfile(userId, { 
              dailyCalorieGoal: newDailyCalories
            });
          }
        }
        
        setModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating your profile');
    }
  };
  
  // Profile items to display
  const profileItems = [
    { label: 'Username', value: userData.name, key: 'name', editable: true },
    { 
      label: 'Gender', 
      value: userData.gender, 
      key: 'gender', 
      editable: true, 
      inputType: 'select' as const,
      options: ['Male', 'Female']
    },
    { 
      label: 'Height', 
      value: userData.height, 
      key: 'height', 
      unit: 'cm', 
      editable: true, 
      inputType: 'numeric' as const 
    },
    { 
      label: 'Weight', 
      value: userData.weight, 
      key: 'weight', 
      unit: 'kg', 
      editable: true, 
      inputType: 'numeric' as const 
    },
    { 
      label: 'Age', 
      value: userData.age, 
      key: 'age', 
      unit: 'yr', 
      editable: true, 
      inputType: 'numeric' as const 
    },
    { 
      label: 'Activity Level', 
      value: userData.activityLevel, 
      key: 'activityLevel', 
      editable: true,
      inputType: 'select' as const,
      options: ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']
    },
    { label: 'BMI', value: userData.bmi, key: 'bmi', unit: 'kg/m²', editable: false },
    { 
      label: 'Target Weight', 
      value: userData.targetWeight, 
      key: 'targetWeight', 
      unit: 'kg', 
      editable: true, 
      inputType: 'numeric' as const 
    },
    { label: 'Weight Change', value: userData.weightChange, key: 'weightChange', unit: 'kg', editable: false },
    { label: 'Goal', value: userData.goal, key: 'goal', editable: false },
    { label: 'Weight Change Per Week', value: userData.weightChangePerWeek, key: 'weightChangePerWeek', editable: false },
    { label: 'Goal Achieve Date', value: userData.goalAchieveDate, key: 'goalAchieveDate', editable: false },
    { label: 'Calorie Intake', value: userData.calorieIntake, key: 'calorieIntake', unit: 'kcal', editable: false },
    { label: 'Protein', value: userData.protein, key: 'protein', editable: false },
  ];
  
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }
  
  // Render different modal content based on inputType
  const renderModalContent = () => {
    if (!editItem) return null;
    
    switch (editItem.inputType) {
      case 'select':
        return (
          <View className="w-full mb-2.5">
            {editItem.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                className={`py-3 px-5 border rounded-lg mb-2 ${editItem.value === option ? 'bg-orange-500 border-orange-500' : 'border-gray-200'}`}
                onPress={() => setEditItem({...editItem, value: option})}
              >
                <Text 
                  className={`text-base text-center ${editItem.value === option ? 'text-white font-semibold' : 'text-gray-500'}`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        
      case 'numeric':
        return (
          <View className="flex-row items-center justify-center w-full mb-2.5">
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
              onPress={() => {
                const currentValue = parseFloat(editItem.value || '0');
                if (currentValue > 0) {
                  setEditItem({...editItem, value: (currentValue - 1).toString()});
                }
              }}
            >
              <Text className="text-2xl font-bold text-orange-500">-</Text>
            </TouchableOpacity>
            
            <TextInput
              className="w-20 h-12 border-b-2 border-orange-500 text-2xl font-bold text-center mx-4"
              value={editItem.value}
              onChangeText={(text) => {
                // Only allow numbers and decimal point
                const filtered = text.replace(/[^0-9.]/g, '');
                setEditItem({...editItem, value: filtered});
              }}
              keyboardType="numeric"
              textAlign="center"
            />
            
            <TouchableOpacity 
              className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
              onPress={() => {
                const currentValue = parseFloat(editItem.value || '0');
                setEditItem({...editItem, value: (currentValue + 1).toString()});
              }}
            >
              <Text className="text-2xl font-bold text-orange-500">+</Text>
            </TouchableOpacity>
            
            {editItem.unit && (
              <Text className="text-base text-gray-500 ml-1">{editItem.unit}</Text>
            )}
          </View>
        );
        
      default:
        return (
          <TextInput
            className="w-full h-12 border border-gray-200 rounded-lg px-3 mb-5 text-base"
            value={editItem.value}
            onChangeText={(text) => setEditItem({...editItem, value: text})}
            placeholder={`Enter ${editItem.label}`}
            keyboardType={editItem.inputType === 'text' ? 'default' : 'numeric'}
          />
        );
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="chevron-back" size={28} color="#f97316" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-orange-500 ml-3">User Profile</Text>
      </View>
      
      <ScrollView className="flex-1 px-4">
        {profileItems.map((item, index) => (
          <View key={index} className="flex-row justify-between items-center py-4 border-b border-gray-200">
            <Text className="text-base text-gray-500">{item.label}</Text>
            <View className="flex-row items-center">
              <Text className="text-base font-medium text-orange-500 mr-2">
                {item.value}{item.unit ? ` ${item.unit}` : ''}
              </Text>
              {item.editable && (
                <TouchableOpacity 
                  onPress={() => openEditModal(item.key, item.label, item.value, item.unit, item.inputType, item.options)}
                  className="p-1"
                >
                  <Ionicons name="pencil" size={18} color="#f97316" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-4/5 bg-white rounded-xl p-5 items-center shadow-lg">
            <Text className="text-lg font-bold mb-4">Edit {editItem?.label}</Text>
            
            {renderModalContent()}
            
            <View className="flex-row justify-between w-full mt-5">
              <TouchableOpacity 
                className="flex-1 h-11 rounded-lg justify-center items-center mx-2 bg-gray-100" 
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-500 font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 h-11 rounded-lg justify-center items-center mx-2 bg-orange-500" 
                onPress={handleSaveEdit}
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}