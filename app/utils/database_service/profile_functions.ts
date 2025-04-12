import { db } from "@/app/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";

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
