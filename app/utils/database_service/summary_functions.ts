import { Timestamp } from "firebase/firestore";
import { getFoodIntakeByDate } from "./calorie_intake_functions";
import { getExerciseByDate } from "./exercise_tracking_functions";
import { getUserProfile } from "./profile_functions";

interface IntakeEntry {
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  [key: string]: any;
}

interface ExerciseEntry {
  caloriesBurned: number;
  [key: string]: any;
}

interface UserProfile {
  gender: "male" | "female";
  height: number;
  weight: number;
  age: number;
  activityLevel: keyof typeof activityMultipliers;
  [key: string]: any;
}

interface DailySummary {
  date: Date;
  totalCaloriesIn: number;
  totalCaloriesOut: number;
  bmr: number;
  tdee: number;
  netCalories: number;
  nutrition: {
    carbs: number;
    protein: number;
    fats: number;
  };
  intakeBreakdown: IntakeEntry[];
  exerciseBreakdown: ExerciseEntry[];
}

interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const activityMultipliers: { [key: string]: number } = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const getDailySummary = async (
  userId: string,
  date: Date
): Promise<Result<DailySummary>> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const { data: intakeData = [] } = await getFoodIntakeByDate(
      userId,
      startTimestamp,
      endTimestamp
    );

    const { data: exerciseData = [] } = await getExerciseByDate(
      userId,
      startTimestamp,
      endTimestamp
    );

    const totalCaloriesIn = intakeData.reduce(
      (sum, item) => sum + (item.calories || 0),
      0
    );
    const totalCaloriesOut = exerciseData.reduce(
      (sum, item) => sum + (item.caloriesBurned || 0),
      0
    );

    const totalCarbs = intakeData.reduce((sum, item) => sum + (item.carbs || 0), 0);
    const totalProtein = intakeData.reduce((sum, item) => sum + (item.protein || 0), 0);
    const totalFats = intakeData.reduce((sum, item) => sum + (item.fats || 0), 0);

    const { data: userProfile } = await getUserProfile(userId);
    if (!userProfile) throw new Error("User profile not found");

    let bmr = 0;
    if (userProfile.gender === "male") {
      bmr =
        88.362 +
        13.397 * (userProfile.weight as number) +
        4.799 * (userProfile.height as number) -
        5.677 * userProfile.age;
    } else {
      bmr =
        447.593 +
        9.247 * (userProfile.weight as number) +
        3.098 * (userProfile.height as number) -
        4.33 * userProfile.age;
    }

    const tdee =
      bmr * activityMultipliers[userProfile.activityLevel || "sedentary"];
    const netCalories = totalCaloriesIn - totalCaloriesOut - tdee;

    return {
      success: true,
      data: {
        date,
        totalCaloriesIn,
        totalCaloriesOut,
        bmr,
        tdee,
        netCalories,
        nutrition: {
          carbs: totalCarbs,
          protein: totalProtein,
          fats: totalFats,
        },
        intakeBreakdown: intakeData,
        exerciseBreakdown: exerciseData,
      },
    };
  } catch (error: any) {
    console.error("Error getting daily summary:", error);
    return { success: false, error: error.message };
  }
};

export const getWeeklySummary = async (
  userId: string,
  startDate: Date
): Promise<Result<DailySummary[]>> => {
  try {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const dailySummaries: DailySummary[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const { data: summary } = await getDailySummary(userId, new Date(currentDate));
      if (summary) dailySummaries.push(summary);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { success: true, data: dailySummaries };
  } catch (error: any) {
    console.error("Error getting weekly summary:", error);
    return { success: false, error: error.message };
  }
};
