import { db } from "@/app/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Define interfaces for food data types
interface IntakeData {
  foodId?: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'other';
  amount: string;
  calories: number | string;
  carbs: number | string;
  protein: number | string;
  fats: number | string;
  image?: string | null;
  date?: any; // Accept any type for date, we'll handle it properly
}

interface FoodData {
  detectedFood: string;
  calories: number | string;
  carbs: number | string;
  protein: number | string;
  fats: number | string;
  date?: any; // Accept any type for date
}

interface Result {
  success: boolean;
  id?: string;
  data?: any[];
  error?: string;
}

// Helper function to safely handle date values
const safelyHandleDate = (dateValue: any) => {
  if (!dateValue) {
    return serverTimestamp();
  }
  
  // If it's already a valid Timestamp object
  if (dateValue instanceof Timestamp) {
    return dateValue;
  }
  
  // If it has seconds and nanoseconds properties (like a Firestore timestamp)
  if (dateValue.seconds !== undefined && dateValue.nanoseconds !== undefined) {
    try {
      return new Timestamp(dateValue.seconds, dateValue.nanoseconds);
    } catch (e) {
      console.warn("Invalid timestamp values, using serverTimestamp instead");
      return serverTimestamp();
    }
  }
  
  // If it's a JavaScript Date object
  if (dateValue instanceof Date) {
    return Timestamp.fromDate(dateValue);
  }
  
  // Default to server timestamp
  return serverTimestamp();
};

export const logFoodIntake = async (
  userId: string, 
  intakeData: IntakeData,
  onSuccess?: () => void
): Promise<Result> => {
  try {
    const intakeRef = collection(db, 'userProfiles', userId, 'calorieIntake');
    
    const docRef = await addDoc(intakeRef, {
      foodId: intakeData.foodId,
      name: intakeData.name,
      category: intakeData.category,
      amount: intakeData.amount,
      calories: parseFloat(String(intakeData.calories)),
      carbs: parseFloat(String(intakeData.carbs)),
      protein: parseFloat(String(intakeData.protein)),
      fats: parseFloat(String(intakeData.fats)),
      image: intakeData.image || null,
      date: safelyHandleDate(intakeData.date)
    });
    
    // Call the success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error logging food intake:", error);
    return { success: false, error: error.message };
  }
};

export const getFoodIntakeByDate = async (
  userId: string, 
  startDate: Timestamp,
  endDate: Timestamp
): Promise<Result> => {
  try {
    const intakeRef = collection(db, 'userProfiles', userId, 'calorieIntake');
    const q = query(
      intakeRef, 
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date')
    );
    
    const querySnapshot = await getDocs(q);
    const intakes: any[] = [];
    
    querySnapshot.forEach((doc) => {
      intakes.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: intakes };
  } catch (error: any) {
    console.error("Error getting food intake:", error);
    return { success: false, error: error.message };
  }
};

export const deleteFoodIntake = async (
  userId: string,
  intakeId: string
): Promise<Result> => {
  try {
    const intakeRef = doc(db, 'userProfiles', userId, 'calorieIntake', intakeId);
    await deleteDoc(intakeRef);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting food intake:", error);
    return { success: false, error: error.message };
  }
};

export const logCameraDetectedFood = async (
  userId: string,
  foodData: FoodData,
  onSuccess?: () => void
): Promise<Result> => {
  try {
    const intakeRef = collection(db, 'userProfiles', userId, 'calorieIntake');
    
    const docRef = await addDoc(intakeRef, {
      detectionMethod: 'camera',
      name: foodData.detectedFood,
      category: 'other', // Default category for camera-detected food
      amount: 'detected portion', // Default amount text
      calories: parseFloat(String(foodData.calories)),
      carbs: parseFloat(String(foodData.carbs)),
      protein: parseFloat(String(foodData.protein)),
      fats: parseFloat(String(foodData.fats)),
      date: safelyHandleDate(foodData.date)
    });
    
    // Call the success callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error logging camera detected food:", error);
    return { success: false, error: error.message };
  }
};

// Get all food intake records for a user (entire history)
export const getAllFoodIntakeRecords = async (
  userId: string
): Promise<Result> => {
  try {
    const intakeRef = collection(db, 'userProfiles', userId, 'calorieIntake');
    const q = query(intakeRef, orderBy('date', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const intakes: any[] = [];
    
    querySnapshot.forEach((doc) => {
      intakes.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: intakes };
  } catch (error: any) {
    console.error("Error getting all food intake records:", error);
    return { success: false, error: error.message };
  }
};

// Get food intake records for today
export const getTodayFoodIntake = async (
  userId: string
): Promise<Result> => {
  try {
    // Get the start and end of today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Convert to Firebase Timestamps
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);
    
    return await getFoodIntakeByDate(userId, startTimestamp, endTimestamp);
  } catch (error: any) {
    console.error("Error getting today's food intake:", error);
    return { success: false, error: error.message };
  }
};