import { db } from "@/app/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

// Type for the data used when adding a new exercise
export interface ExerciseData {
  name: string;
  caloriesPerMinute: number | string;
  image?: string | null; // Could be a base64 string, a local URI, or a remote URL
  instructions?: string | null;
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
