// types/firebase.ts
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  gender: string;
  height: number;
  weight: number;
  age: number;
  activityLevel: string;
  targetWeight: number;
  workoutFrequency: number;
  healthConcerns: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ExerciseData = {
  type: 'gym_exercise' | 'steps' | 'camera_detection';
  category: string;
  name: string;
  duration: number;
  caloriesBurned: number;
  date: Timestamp;
};

export type FoodIntake = {
  foodId?: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'other';
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  image?: string | null;
  date: Timestamp;
  detectionMethod?: 'camera';
};

export type FoodItem = {
  name: string;
  image?: string | null;
  amount: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  createdAt: Timestamp;
};

export type WeightEntry = {
  weight: number;
  date: Timestamp;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};