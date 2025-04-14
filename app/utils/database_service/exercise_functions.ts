import { db } from "@/app/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";

// Type for the data used when adding a new exercise
export interface ExerciseData {
  name: string;
  caloriesPerMinute: number | string;
  image?: string | null; // Could be a base64 string, a local URI, or a remote URL
  instructions?: string | null;
}

// Type for category data
export interface CategoryData {
  id: string;
  name: string;
  icon?: string;
}

// Generic response type
interface Result<T = any> {
  success: boolean;
  id?: string;
  data?: T;
  error?: string;
}

// Function to add an exercise to Firestore
export const addExercise = async (
  categoryType: string,
  exerciseData: ExerciseData
): Promise<Result> => {
  try {
    const exerciseRef = collection(
      db,
      "exerciseDatabase",
      categoryType,
      "exercises"
    );

    const docRef = await addDoc(exerciseRef, {
      name: exerciseData.name,
      caloriesPerMinute: parseFloat(String(exerciseData.caloriesPerMinute)),
      image: exerciseData.image || null,
      instructions: exerciseData.instructions || null,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error adding exercise:", error);
    return { success: false, error: error.message };
  }
};

// Function to retrieve all exercises for a category
export const getExercises = async (
  categoryType: string
): Promise<Result<ExerciseData[]>> => {
  try {
    const exerciseRef = collection(
      db,
      "exerciseDatabase",
      categoryType,
      "exercises"
    );

    const q = query(exerciseRef, orderBy("name"));
    const querySnapshot = await getDocs(q);

    const exercises: ExerciseData[] = [];
    querySnapshot.forEach((doc) => {
      exercises.push({ id: doc.id, ...doc.data() } as ExerciseData & { id: string });
    });

    return { success: true, data: exercises };
  } catch (error: any) {
    console.error("Error getting exercises:", error);
    return { success: false, error: error.message };
  }
};

// Function to get all available exercise categories
export const getExerciseCategories = async (): Promise<Result<CategoryData[]>> => {
  try {
    // Define your known category IDs
    const categoryIds = ['cardio', 'strength_training', 'bodyweight', 'camera_detection'];
    
    // Map the categories to have proper structure with ID and name
    const categories: CategoryData[] = [];
    
    // Default icons mapping
    const iconMapping: { [key: string]: string } = {
      'cardio': 'bicycle-outline',
      'strength_training': 'barbell-outline',
      'bodyweight': 'body-outline',
      'camera_detection': 'camera-outline',
      'yoga': 'walk-outline',
      'hiit': 'fitness-outline',
      'sports': 'basketball-outline',
      'fullbody': 'body-outline'
    };
    
    // Check each category and verify if it exists by attempting to read its "exercises" subcollection
    for (const id of categoryIds) {
      try {
        const exercisesRef = collection(db, "exerciseDatabase", id, "exercises");
        const exercisesSnapshot = await getDocs(query(exercisesRef, orderBy("name")));

        // Even if no exercises exist, if the collection exists, we consider the category valid
        const name = id
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
          console.log('names',name)
        categories.push({
          id: id,
          name: name,
          icon: iconMapping[id] || 'fitness-outline',
        });
      } catch (err) {
        console.log(`Category ${id} might not exist:`, err);
        // Continue to the next category
      }
    }
    
    return { success: true, data: categories };
  } catch (error: any) {
    console.error("Error getting exercise categories:", error);
    return { success: false, error: error.message };
  }
};
