import { db } from "@/app/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

// Define the result type
interface Result<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define a weight entry type
export interface WeightEntry {
  id: string;
  weight: number;
  date: Timestamp;
}

// Get weight progress between two dates
export const getWeightProgressByDateRange = async (
  userId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<Result<WeightEntry[]>> => {
  try {
    const weightRef = collection(db, "userProfiles", userId, "weightHistory");

    const q = query(
      weightRef,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date")
    );

    const querySnapshot = await getDocs(q);
    const weightEntries: WeightEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      weightEntries.push({
        id: doc.id,
        weight: data.weight,
        date: data.date,
      });
    });

    return { success: true, data: weightEntries };
  } catch (error: any) {
    console.error("Error getting weight progress:", error);
    return { success: false, error: error.message };
  }
};
