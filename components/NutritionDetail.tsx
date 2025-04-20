import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { getFoodIntakeByDate } from '../app/utils/database_service/calorie_intake_functions';
import { db } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface NutritionTrackerProps {
  userId: string;
  selectedDate: Date;
  onDataUpdate?: () => void;
}

interface NutritionStats {
  average: number;
  percentage: number;
  goal: number;
  goalPercentage: number;
}

interface ProgressData {
  label: string;
  actual: number;
  total: number;
  rawValue: number;
}

interface FoodItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  image?: string | null;
  date: Timestamp;
}

export default function NutritionTracker({ userId, selectedDate, onDataUpdate }: NutritionTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Daily');
  const [isLoading, setIsLoading] = useState(true);
  const [userGoals, setUserGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 225,
    fats: 65
  });
  
  // Nutrition stats state
  const [calorieStats, setCalorieStats] = useState<NutritionStats>({ average: 0, percentage: 0, goal: 2000, goalPercentage: 0 });
  const [proteinStats, setProteinStats] = useState<NutritionStats>({ average: 0, percentage: 0, goal: 150, goalPercentage: 0 });
  const [carbStats, setCarbStats] = useState<NutritionStats>({ average: 0, percentage: 0, goal: 225, goalPercentage: 0 });
  const [fatStats, setFatStats] = useState<NutritionStats>({ average: 0, percentage: 0, goal: 65, goalPercentage: 0 });
  
  // Progress data state
  const [caloriesProgress, setCaloriesProgress] = useState<ProgressData[]>([]);
  const [proteinProgress, setProteinProgress] = useState<ProgressData[]>([]);
  const [carbsProgress, setCarbsProgress] = useState<ProgressData[]>([]);
  const [fatProgress, setFatProgress] = useState<ProgressData[]>([]);

  // Load user's calorie and macronutrient goals from profile
  useEffect(() => {
    const loadUserGoals = async () => {
      if (!userId) return;
      
      try {
        const userDoc = doc(db, "userProfiles", userId);
        const userProfile = await getDoc(userDoc);
        
        if (userProfile.exists()) {
          const userData = userProfile.data();
          
          // Get daily calorie goal if available or use default
          const calorieGoal = userData.dailyCalorieGoal ? Number(userData.dailyCalorieGoal) : 2000;
          
          // Calculate macronutrient goals based on calorie distribution
          // Typically: 30% protein, 45% carbs, 25% fat
          const proteinGoal = Math.round(calorieGoal * 0.3 / 4); // 4 calories per gram of protein
          const carbsGoal = Math.round(calorieGoal * 0.45 / 4);  // 4 calories per gram of carbs
          const fatsGoal = Math.round(calorieGoal * 0.25 / 9);   // 9 calories per gram of fat
          
          setUserGoals({
            calories: calorieGoal,
            protein: proteinGoal,
            carbs: carbsGoal,
            fats: fatsGoal
          });
          
          // Update goals in stats
          setCalorieStats(prev => ({ ...prev, goal: calorieGoal }));
          setProteinStats(prev => ({ ...prev, goal: proteinGoal }));
          setCarbStats(prev => ({ ...prev, goal: carbsGoal }));
          setFatStats(prev => ({ ...prev, goal: fatsGoal }));
        }
      } catch (error) {
        console.error("Error loading user goals:", error);
      }
    };
    
    loadUserGoals();
  }, [userId]);

  // Force reload when the selectedDate changes
  useEffect(() => {
    if (userId) {
      loadNutritionData(selectedPeriod);
    }
  }, [userId, selectedDate]);

  // Force reload when the selected period or user goals change
  useEffect(() => {
    if (userId) {
      loadNutritionData(selectedPeriod);
    }
  }, [selectedPeriod, userGoals]);

  const loadNutritionData = async (period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly') => {
    setIsLoading(true);
    
    try {
      // Calculate date ranges based on selected period
      const { startDate, endDate, days } = getDateRange(selectedDate, period);
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      // Get real food data from Firestore
      const result = await getFoodIntakeByDate(userId, startTimestamp, endTimestamp);
      
      let foodData: FoodItem[] = [];
      if (result.success && result.data) {
        foodData = result.data as FoodItem[];
      }
      
      // Process real data
      const processedData = processNutritionData(foodData, days, period);
      
      // Update state with calculated stats
      setCalorieStats({
        average: processedData.calories.average,
        percentage: processedData.calories.percentage,
        goal: userGoals.calories,
        goalPercentage: processedData.calories.goalPercentage
      });
      
      setProteinStats({
        average: processedData.protein.average,
        percentage: processedData.protein.percentage,
        goal: userGoals.protein,
        goalPercentage: processedData.protein.goalPercentage
      });
      
      setCarbStats({
        average: processedData.carbs.average,
        percentage: processedData.carbs.percentage,
        goal: userGoals.carbs,
        goalPercentage: processedData.carbs.goalPercentage
      });
      
      setFatStats({
        average: processedData.fats.average,
        percentage: processedData.fats.percentage,
        goal: userGoals.fats,
        goalPercentage: processedData.fats.goalPercentage
      });
      
      // Update progress data
      setCaloriesProgress(processedData.caloriesProgress);
      setProteinProgress(processedData.proteinProgress);
      setCarbsProgress(processedData.carbsProgress);
      setFatProgress(processedData.fatProgress);
      
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    } finally {
      setIsLoading(false);
      
      // Notify parent component that data has been updated after loading completes
      if (onDataUpdate) {
        console.log("Notifying parent component of nutrition data update");
        onDataUpdate();
      }
    }
  };

  const getDateRange = (date: Date, period: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly') => {
    const currentDate = new Date(date);
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    let days = 1;
    
    switch (period) {
      case 'Daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        days = 1;
        break;
        
      case 'Weekly':
        const dayOfWeek = currentDate.getDay();
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        days = 7;
        break;
        
      case 'Monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        days = endDate.getDate();
        break;
        
      case 'Yearly':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        days = 12;
        break;
    }
    
    return { startDate, endDate, days };
  };

  const processNutritionData = (data: FoodItem[], days: number, period: string) => {
    const result = {
      calories: { total: 0, average: 0, percentage: 0, goalPercentage: 0 },
      protein: { total: 0, average: 0, percentage: 0, goalPercentage: 0 },
      carbs: { total: 0, average: 0, percentage: 0, goalPercentage: 0 },
      fats: { total: 0, average: 0, percentage: 0, goalPercentage: 0 },
      caloriesProgress: [] as ProgressData[],
      proteinProgress: [] as ProgressData[],
      carbsProgress: [] as ProgressData[],
      fatProgress: [] as ProgressData[]
    };
    
    // Use actual user goals
    const goals = {
      calories: userGoals.calories,
      protein: userGoals.protein,
      carbs: userGoals.carbs,
      fats: userGoals.fats
    };
    
    // Process nutrition data from food items
    data.forEach(item => {
      // Ensure proper number handling
      const calories = typeof item.calories === 'number' ? item.calories : Number(item.calories) || 0;
      const protein = typeof item.protein === 'number' ? item.protein : Number(item.protein) || 0;
      const carbs = typeof item.carbs === 'number' ? item.carbs : Number(item.carbs) || 0;
      const fats = typeof item.fats === 'number' ? item.fats : Number(item.fats) || 0;
      
      result.calories.total += calories;
      result.protein.total += protein;
      result.carbs.total += carbs;
      result.fats.total += fats;
    });
    
    result.calories.average = Math.round(result.calories.total / (data.length ? Math.min(days, data.length) : 1));
    result.protein.average = Math.round(result.protein.total / (data.length ? Math.min(days, data.length) : 1));
    result.carbs.average = Math.round(result.carbs.total / (data.length ? Math.min(days, data.length) : 1));
    result.fats.average = Math.round(result.fats.total / (data.length ? Math.min(days, data.length) : 1));
    
    result.calories.percentage = Math.round((result.calories.average / goals.calories) * 100);
    result.protein.percentage = Math.round((result.protein.average / goals.protein) * 100);
    result.carbs.percentage = Math.round((result.carbs.average / goals.carbs) * 100);
    result.fats.percentage = Math.round((result.fats.average / goals.fats) * 100);
    
    result.calories.goalPercentage = result.calories.percentage;
    result.protein.goalPercentage = result.protein.percentage;
    result.carbs.goalPercentage = result.carbs.percentage;
    result.fats.goalPercentage = result.fats.percentage;
    
    // For daily view, group food by time of day
    if (period === 'Daily' && data.length > 0) {
      // Create time-based progress for daily view
      const timeGroups: {[key: string]: {calories: number, protein: number, carbs: number, fats: number}} = {
        '6AM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '9AM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '12PM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '3PM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '6PM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '9PM': {calories: 0, protein: 0, carbs: 0, fats: 0},
        '12AM': {calories: 0, protein: 0, carbs: 0, fats: 0}
      };
      
      // Distribute food items into time groups based on timestamp
      data.forEach(item => {
        if (item.date) {
          const date = item.date.toDate();
          const hour = date.getHours();
          let timeGroup = '12AM';
          
          if (hour < 7) timeGroup = '6AM';
          else if (hour < 10) timeGroup = '9AM';
          else if (hour < 13) timeGroup = '12PM';
          else if (hour < 16) timeGroup = '3PM';
          else if (hour < 19) timeGroup = '6PM';
          else if (hour < 22) timeGroup = '9PM';
          
          timeGroups[timeGroup].calories += typeof item.calories === 'number' ? item.calories : Number(item.calories) || 0;
          timeGroups[timeGroup].protein += typeof item.protein === 'number' ? item.protein : Number(item.protein) || 0;
          timeGroups[timeGroup].carbs += typeof item.carbs === 'number' ? item.carbs : Number(item.carbs) || 0;
          timeGroups[timeGroup].fats += typeof item.fats === 'number' ? item.fats : Number(item.fats) || 0;
        }
      });
      
      // Convert time groups to progress data
      const times = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'];
      
      result.caloriesProgress = times.map(time => ({
        label: time,
        actual: Math.min(Math.round((timeGroups[time].calories / goals.calories) * 100), 200),
        total: 100,
        rawValue: timeGroups[time].calories
      }));
      
      result.proteinProgress = times.map(time => ({
        label: time,
        actual: Math.min(Math.round((timeGroups[time].protein / goals.protein) * 100), 200),
        total: 100,
        rawValue: timeGroups[time].protein
      }));
      
      result.carbsProgress = times.map(time => ({
        label: time,
        actual: Math.min(Math.round((timeGroups[time].carbs / goals.carbs) * 100), 200),
        total: 100,
        rawValue: timeGroups[time].carbs
      }));
      
      result.fatProgress = times.map(time => ({
        label: time,
        actual: Math.min(Math.round((timeGroups[time].fats / goals.fats) * 100), 200),
        total: 100,
        rawValue: timeGroups[time].fats
      }));
    } else {
      // Simplified progress data creation for other time periods
      const labels = period === 'Daily' ? ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'] :
                    period === 'Weekly' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] :
                    period === 'Monthly' ? ['W1', 'W2', 'W3', 'W4', 'W5'] :
                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const createProgress = (nutrient: keyof typeof goals) => {
        return labels.map((label, i) => ({
          label,
          actual: Math.min(Math.round((result[nutrient].average / goals[nutrient]) * 100), 200),
          total: 100,
          rawValue: result[nutrient].average
        }));
      };
      
      result.caloriesProgress = createProgress('calories');
      result.proteinProgress = createProgress('protein');
      result.carbsProgress = createProgress('carbs');
      result.fatProgress = createProgress('fats');
    }
    
    return result;
  };

  const getProgressData = (type: 'calories' | 'protein' | 'carbs' | 'fat') => {
    switch (type) {
      case 'calories': return caloriesProgress;
      case 'protein': return proteinProgress;
      case 'carbs': return carbsProgress;
      case 'fat': return fatProgress;
      default: return [];
    }
  };

  const NutritionSection = ({ 
    title, 
    stats, 
    type, 
    color 
  }: { 
    title: string; 
    stats: NutritionStats; 
    type: 'calories' | 'protein' | 'carbs' | 'fat'; 
    color: string 
  }) => {
    if (isLoading) {
      return (
        <View style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', marginBottom: 32, padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: color === 'secondary' ? '#f8a100' : color }}>{title}</Text>
          <ActivityIndicator size="large" color={color === 'secondary' ? '#f8a100' : color} />
        </View>
      );
    }
    
    return (
      <View style={{ backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', marginBottom: 32, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: color === 'secondary' ? '#f8a100' : color }}>{title}</Text>
          <Text style={{ color: '#666' }}>{stats.average} {type === 'calories' ? 'kcal' : 'g'} ({stats.percentage}%)</Text>
        </View>
        
        <Text style={{ color: '#666' }}>
          Your average daily {title.toLowerCase()} consumption is {stats.average} {type === 'calories' ? 'kcal' : 'g'} which is {stats.goalPercentage}% of your goal ({stats.goal} {type === 'calories' ? 'kcal' : 'g'})
        </Text>
        
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 32 }}>{selectedPeriod} Progress</Text>
          <View style={{ height: 160, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {getProgressData(type).map((item, index) => (
              <View key={index} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    backgroundColor: `${color}20`,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    height: `${item.total}%`,
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      backgroundColor: color === 'secondary' ? '#f8a100' : color,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      height: `${item.actual}%`,
                      bottom: 0,
                      position: 'absolute',
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.label}</Text>
                {item.rawValue > 0 && (
                  <Text style={{ fontSize: 10, color: '#888' }}>{item.rawValue}</Text>
                )}
              </View>
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selectedPeriod === period ? (color === 'secondary' ? '#f8a100' : color) : '#e5e7eb'
                }}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={{ color: selectedPeriod === period ? 'white' : '#666' }}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 70 }}>
      <NutritionSection 
        title="Calories" 
        stats={calorieStats} 
        type="calories" 
        color="#f8a100" 
      />
      
      <NutritionSection 
        title="Protein" 
        stats={proteinStats} 
        type="protein" 
        color="#3b82f6" 
      />
      
      <NutritionSection 
        title="Carbs" 
        stats={carbStats} 
        type="carbs" 
        color="#10b981" 
      />
      
      <NutritionSection 
        title="Fat" 
        stats={fatStats} 
        type="fat" 
        color="#f97316" 
      />
    </View>
  );
}