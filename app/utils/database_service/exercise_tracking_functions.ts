import { db } from "@/app/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, where, serverTimestamp } from "firebase/firestore";

interface ExerciseData {
  id?: string; // Make id optional since it's added separately
  type: string;
  category?: string;
  name?: string;
  duration?: number;
  caloriesBurned: number;
  date: Timestamp;
  steps?: number;
}

export const logExercise = async (userId: string, exerciseData: Omit<ExerciseData, 'id'>) => {
  try {
    const exerciseRef = collection(db, 'userProfiles', userId, 'calorieOutgoing');
    const docRef = await addDoc(exerciseRef, {
      type: exerciseData.type,
      caloriesBurned: exerciseData.caloriesBurned,
      date: exerciseData.date,
      ...(exerciseData.category && { category: exerciseData.category }),
      ...(exerciseData.name && { name: exerciseData.name }),
      ...(exerciseData.duration && { duration: exerciseData.duration })
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error logging exercise:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const logSteps = async (userId: string, stepsData: { steps: number; date?: Timestamp }) => {
  try {
    const exerciseRef = collection(db, 'userProfiles', userId, 'calorieOutgoing');
    const docRef = await addDoc(exerciseRef, {
      type: 'steps',
      steps: parseInt(stepsData.steps.toString()),
      caloriesBurned: parseFloat((stepsData.steps * 0.04).toString()),
      date: stepsData.date || serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error logging steps:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getExerciseByDate = async (userId: string, startDate: Timestamp, endDate: Timestamp) => {
  try {
    const exerciseRef = collection(db, 'userProfiles', userId, 'calorieOutgoing');
    const q = query(
      exerciseRef, 
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date')
    );
    
    const querySnapshot = await getDocs(q);
    const exercises: ExerciseData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      exercises.push({
        id: doc.id,
        type: data.type,
        caloriesBurned: data.caloriesBurned,
        date: data.date,
        ...(data.category && { category: data.category }),
        ...(data.name && { name: data.name }),
        ...(data.duration && { duration: data.duration }),
        ...(data.steps && { steps: data.steps })
      });
    });
    
    return { success: true, data: exercises };
  } catch (error) {
    console.error("Error getting exercises:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const deleteExercise = async (userId: string, exerciseId: string) => {
  try {
    const exerciseRef = doc(db, 'userProfiles', userId, 'calorieOutgoing', exerciseId);
    await deleteDoc(exerciseRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};