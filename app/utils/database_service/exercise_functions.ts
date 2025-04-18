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
  image?: string | null;
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
    const categoryIds = ['cardio', 'strength_training', 'bodyweight', 'aerobic'];
    
    // Map the categories to have proper structure with ID and name
    const categories: CategoryData[] = [];
    
    // Default icons mapping
    const iconMapping: { [key: string]: string } = {
						"cardio": "bicycle-outline",
						"strength_training": "barbell-outline",
						"bodyweight": "body-outline",
						"aerobic": "walk-outline",
						"yoga": "walk-outline",
						"hiit": "fitness-outline",
						"sports": "basketball-outline",
						"fullbody": "body-outline",
    };
    const imageMapping: { [key: string]: string } = {
      "cardio": "https://img.freepik.com/free-photo/happy-female-athlete-running-treadmill-gym_637285-8562.jpg",
      "strength_training": "https://hips.hearstapps.com/hmg-prod/images/how-to-start-weight-lifting-strength-training-for-women-1647617733.jpg?crop=0.887037037037037xw:1xh;center,top&resize=1200:*",
      "bodyweight": "https://cdn.squats.in/kc_articles/2f34cec9bc222f4cc9a3c72e731015f7.jpg",
      "aerobic": "https://img.freepik.com/free-vector/flat-hand-drawn-dance-fitness-class-illustration_52683-56671.jpg?semt=ais_hybrid&w=740",
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
          image: imageMapping[id] || 'https://picsum.photos/200/300?random=1',
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
