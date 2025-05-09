import { db } from "@/app/firebase";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { Animated } from "react-native";

// ---------- Types ----------
export interface UserProfile {
  gender: string;
  height: number | string;
  weight: number | string;
  age: number;
  activityLevel: string;
  targetWeight: number | string;
  workoutFrequency: string;
  healthConcerns?: string;
}

interface Result<T = any> {
  success: boolean;
  userId?: string;
  data?: T;
  error?: string;
}

// ---------- Functions ----------

// Create or update user profile
export const createUserProfile = async (
  userId: string,
  userData: UserProfile
): Promise<Result> => {
  try {
    const userRef = doc(db, "userProfiles", userId);
    await updateDoc(userRef, {
      gender: userData.gender,
      height: parseFloat(String(userData.height)),
      weight: parseFloat(String(userData.weight)),
      age: userData.age,
      activityLevel: userData.activityLevel,
      targetWeight: parseFloat(String(userData.targetWeight)),
      workoutFrequency: userData.workoutFrequency,
      healthConcerns: userData.healthConcerns || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, userId };
  } catch (error: any) {
    console.error("Error creating user profile:", error);
    return { success: false, error: error.message };
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<Result<UserProfile>> => {
  try {
    const userIds = userId;
    const userRef = doc(db, "userProfiles", userIds);
    const userSnap = await getDoc(userRef);
    

    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() as UserProfile };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async (): Promise<Result<UserProfile[]>> => {
  try {
    const usersCollectionRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollectionRef);
    const users: UserProfile[] = [];

    console.log("users", users.length);
    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile;
      users.push(userData);
    });

    return { success: true, data: users };
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    return { success: false, error: error.message };
  }
};

// Update weight + log to weight history
export const updateUserWeight = async (
  userId: string,
  newWeight: number | string
): Promise<Result> => {
  try {
    const weightVal = parseFloat(String(newWeight));
    const userRef = doc(db, "userProfiles", userId);
    await updateDoc(userRef, {
      weight: weightVal,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "userProfiles", userId, "weightHistory"), {
      weight: weightVal,
      date: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating weight:", error);
    return { success: false, error: error.message };
  }
};

// Update weight + goal duration
export const updateUserTargets = async (
  userId: string,
  targetWeight: number | string,
  targetDays: number | string
): Promise<Result> => {
  try {
    const userRef = doc(db, "userProfiles", userId);
    await updateDoc(userRef, {
      targetWeight: parseFloat(String(targetWeight)),
      targetDays: parseInt(String(targetDays)),
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating targets:", error);
    return { success: false, error: error.message };
  }
};

// Update user profile with all editable fields
export const updateUserProfile = async (
  userId: string,
  userData: {
    gender?: string;
    height?: number | string;
    weight?: number | string;
    age?: number | string;
    activityLevel?: string;
    targetWeight?: number | string;
    dailyCalorieGoal?: number | string;
    bmi?: number | string;
  }
): Promise<Result> => {
  try {
    // Convert all values to appropriate types
    const updateData: any = {};
    
    if (userData.gender) updateData.gender = userData.gender;
    if (userData.height) updateData.height = parseFloat(String(userData.height));
    if (userData.weight) updateData.weight = parseFloat(String(userData.weight));
    if (userData.age) updateData.age = parseInt(String(userData.age));
    if (userData.activityLevel) updateData.activityLevel = userData.activityLevel;
    if (userData.targetWeight) updateData.targetWeight = parseFloat(String(userData.targetWeight));
    if (userData.dailyCalorieGoal) updateData.dailyCalorieGoal = parseFloat(String(userData.dailyCalorieGoal));
    // Calculate BMI if both height and weight are provided
    if (userData.height && userData.weight) {
      const heightInMeters = parseFloat(String(userData.height)) / 100;
      const weightInKg = parseFloat(String(userData.weight));
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      updateData.bmi = parseFloat(bmi.toFixed(1));
    }

    // Calculate daily calorie goal if we have the necessary information
    if ((userData.weight || updateData.weight) && 
        (userData.height || updateData.height) && 
        (userData.age || updateData.age) && 
        (userData.gender || updateData.gender) && 
        (userData.activityLevel || updateData.activityLevel)) {
      
      // Get existing user data to fill in missing fields
      const userRef = doc(db, "userProfiles", userId);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : {};
      
      const weight = userData.weight ? parseFloat(String(userData.weight)) : existingData.weight;
      const height = userData.height ? parseFloat(String(userData.height)) : existingData.height;
      const age = userData.age ? parseInt(String(userData.age)) : existingData.age;
      const gender = userData.gender || existingData.gender;
      const activityLevel = userData.activityLevel || existingData.activityLevel;
      
      // Calculate BMR using the formula
      const bmr = gender.toLowerCase() === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
      
      // Calculate TDEE based on activity level
      const activityMultipliers: {[key: string]: number} = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very active': 1.9
      };
      
      // Normalize activity level (handle different formats)
      const normalizedActivityLevel = activityLevel.toLowerCase().replace('_', ' ');
      const multiplier = activityMultipliers[normalizedActivityLevel] || 1.2;
      const tdee = Math.round(bmr * multiplier);
      
      // Adjust based on weight goal
      const targetWeight = userData.targetWeight ? parseFloat(String(userData.targetWeight)) : existingData.targetWeight;
      const weightDiff = weight - targetWeight;
      let calorieAdjustment = weightDiff > 0 ? -500 : weightDiff < 0 ? 500 : 0;
      const dailyCalorieGoal = Math.round(tdee + calorieAdjustment);
      
      updateData.bmr = Math.round(bmr);
      updateData.dailyCalorieGoal = dailyCalorieGoal;
    }
    
    // Update the document with timestamp
    updateData.updatedAt = serverTimestamp();
    
    const userRef = doc(db, "userProfiles", userId);
    await updateDoc(userRef, updateData);
    
    // If weight is updated, log to weight history
    if (userData.weight) {
      await addDoc(collection(db, "userProfiles", userId, "weightHistory"), {
        weight: parseFloat(String(userData.weight)),
        date: serverTimestamp(),
      });
    }
    
    return { success: true, data: updateData };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

// Update weight with recalculated targets
export const updateUserWeightWithTargets = async (
  userId: string,
  newWeight: number | string
): Promise<Result> => {
  try {
    const weightVal = parseFloat(String(newWeight));
    
    // Get current user profile to access other parameters needed for calculations
    const userRef = doc(db, "userProfiles", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: "User profile not found" };
    }
    
    const userData = userSnap.data();
    
    // Calculate BMI
    const heightInMeters = userData.height / 100;
    const bmi = weightVal / (heightInMeters * heightInMeters);
    
    // Calculate daily calorie goal
    const bmr = userData.gender.toLowerCase() === 'male'
      ? 10 * weightVal + 6.25 * userData.height - 5 * userData.age + 5
      : 10 * weightVal + 6.25 * userData.height - 5 * userData.age - 161;
    
    // Apply activity multiplier
    const activityMultipliers: {[key: string]: number} = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very active': 1.9
    };
    
    // Normalize activity level (handle different formats)
    const normalizedActivityLevel = userData.activityLevel.toLowerCase().replace('_', ' ');
    const multiplier = activityMultipliers[normalizedActivityLevel] || 1.2;
    const tdee = Math.round(bmr * multiplier);
    
    // Adjust based on weight goal
    const targetWeight = userData.targetWeight;
    const weightDiff = weightVal - targetWeight;
    let calorieAdjustment = 0;
    
    if (weightDiff > 0) {
      // For weight loss
      calorieAdjustment = -500; // Calorie deficit
    } else if (weightDiff < 0) {
      // For weight gain
      calorieAdjustment = 300; // Calorie surplus
    }
    
    const dailyCalorieGoal = Math.round(tdee + calorieAdjustment);
    
    // Calculate weeks to goal based on safe weight change rate
    // Safe rate: 0.5-1kg per week for weight loss, 0.25-0.5kg for weight gain
    const weeklyRate = weightDiff > 0 ? 0.75 : weightDiff < 0 ? 0.5 : 0;
    const weeksToGoal = weeklyRate !== 0 ? Math.abs(weightDiff / weeklyRate) : 0;
    
    // Calculate goal achievement date
    const goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + Math.round(weeksToGoal * 7));
    
    // Update document with new values
    await updateDoc(userRef, {
      weight: weightVal,
      bmi: parseFloat(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      dailyCalorieGoal,
      weightChangePerWeek: weeklyRate !== 0 ? `${weeklyRate} kg` : '0 kg',
      goalAchieveDate: goalDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      updatedAt: serverTimestamp(),
    });

    // Add to weight history
    await addDoc(collection(db, "userProfiles", userId, "weightHistory"), {
      weight: weightVal,
      date: serverTimestamp(),
    });

    return { 
      success: true, 
      data: {
        weight: weightVal,
        bmi: parseFloat(bmi.toFixed(1)),
        dailyCalorieGoal,
        weightDiff: weightDiff,
        targetWeight: targetWeight,
        goalType: weightDiff > 0 ? 'lose' : weightDiff < 0 ? 'gain' : 'maintain'
      }
    };
  } catch (error: any) {
    console.error("Error updating weight with targets:", error);
    return { success: false, error: error.message };
  }
};


