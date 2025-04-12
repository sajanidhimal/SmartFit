import { db } from "@/app/firebase";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";

// Types
export interface FoodItemData {
  id?: string;
  name: string;
  image?: string | null;
  amount: string;
  calories: number | string;
  carbs: number | string;
  protein: number | string;
  fats: number | string;
}

interface Result<T = any> {
  success: boolean;
  id?: string;
  data?: T;
  error?: string;
}

// Add a food item to a category (e.g., breakfast, lunch, etc.)
export const addFoodItem = async (
  categoryType: string,
  foodData: FoodItemData
): Promise<Result> => {
  try {
    const foodRef = collection(db, "foodDatabase", categoryType, "items");
    const docRef = await addDoc(foodRef, {
      name: foodData.name,
      image: foodData.image || null,
      amount: foodData.amount,
      calories: parseFloat(String(foodData.calories)),
      carbs: parseFloat(String(foodData.carbs)),
      protein: parseFloat(String(foodData.protein)),
      fats: parseFloat(String(foodData.fats)),
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error adding food item:", error);
    return { success: false, error: error.message };
  }
};

// Get all food items from a given category
export const getFoodItems = async (
  categoryType: string
): Promise<Result<FoodItemData[]>> => {
  try {
    console.log("Getting food items for category:", categoryType);
    const foodRef = collection(db, "foodDatabase", categoryType, "items");
    const q = query(foodRef, orderBy("name"));
    const querySnapshot = await getDocs(q);
    console.log("Query snapshot:", querySnapshot.docs.length);
    const foodItems: (FoodItemData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      foodItems.push({ id: doc.id, ...doc.data() } as FoodItemData & { id: string });
    });
    console.log("Food items:", foodItems.length);
    return { success: true, data: foodItems };
  } catch (error: any) {
    console.error("Error getting food items:", error);
    return { success: false, error: error.message };
  }
};

// Search food items across all categories
export const searchFoodItems = async (
  searchTerm: string
): Promise<Result<(FoodItemData & { id: string; category: string })[]>> => {
  try {
    const categories = ["breakfast", "lunch", "dinner", "other"];
    let results: (FoodItemData & { id: string; category: string })[] = [];
    
    for (const category of categories) {
      const foodRef = collection(db, "foodDatabase", category, "items");
      const q = query(foodRef); // could be optimized with indexes or full-text search extensions
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        if (
          data.name &&
          data.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          results.push({
            id: doc.id,
            category,
            ...data,
          } as FoodItemData & { id: string; category: string });
        }
      });
    }
    
    return { success: true, data: results };
  } catch (error: any) {
    console.error("Error searching food items:", error);
    return { success: false, error: error.message };
  }
};

// Get all food items across all categories
export const getAllFoodItems = async (): Promise<Result<(FoodItemData & { id: string; category: string })[]>> => {
  try {
    const categories = ["breakfast", "lunch", "dinner", "other"];
    let allItems: (FoodItemData & { id: string; category: string })[] = [];
    
    for (const category of categories) {
      const foodRef = collection(db, "foodDatabase", category, "items");
      const q = query(foodRef, orderBy("name"));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        allItems.push({
          id: doc.id,
          category,
          ...doc.data()
        } as FoodItemData & { id: string; category: string });
      });
    }
    
    return { success: true, data: allItems };
  } catch (error: any) {
    console.error("Error getting all food items:", error);
    return { success: false, error: error.message };
  }
};