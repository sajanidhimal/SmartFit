
import { FoodItemData } from "./database_service/food_functions"; // adjust path if needed

export const normalizeFoodItems = (
    rawItems: (FoodItemData & { id: string; category: string })[]
  ): FoodItemData[] => {
    return rawItems.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image ?? undefined, // convert null -> undefined
      amount:item.amount,
      calories: Number(item.calories),
      carbs: Number(item.carbs),
      protein: Number(item.protein),
      fats: Number(item.fats),
      category: item.category,
    }));
  };