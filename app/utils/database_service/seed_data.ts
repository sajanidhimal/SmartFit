import { addExercise } from "./exercise_functions";
import { addFoodItem } from "./food_functions";

export const seedDefaultFoodDatabase = async () => {
    try {
      // Sample breakfast items
      const breakfastItems = [
        {
          name: "Oatmeal",
          image: "https://example.com/images/oatmeal.jpg",
          amount: "1 cup",
          calories: 150,
          carbs: 27,
          protein: 5,
          fats: 2.5
        },
        {
          name: "Boiled Egg",
          image: "https://example.com/images/boiled_egg.jpg",
          amount: "1 egg",
          calories: 78,
          carbs: 0.6,
          protein: 6.3,
          fats: 5.3
        },
        {
          name: "Whole Wheat Toast",
          image: "https://example.com/images/toast.jpg",
          amount: "1 slice",
          calories: 70,
          carbs: 12,
          protein: 3,
          fats: 1
        },
        {
          name: "Greek Yogurt",
          image: "https://example.com/images/greek_yogurt.jpg",
          amount: "1 cup",
          calories: 130,
          carbs: 6,
          protein: 18,
          fats: 4
        }
      ];
      
      // Sample lunch items
      const lunchItems = [
        {
          name: "Grilled Chicken Salad",
          image: "https://example.com/images/grilled_chicken_salad.jpg",
          amount: "1 bowl",
          calories: 350,
          carbs: 10,
          protein: 35,
          fats: 15
        },
        {
          name: "Tuna Sandwich",
          image: "https://example.com/images/tuna_sandwich.jpg",
          amount: "1 sandwich",
          calories: 290,
          carbs: 28,
          protein: 20,
          fats: 9
        },
        {
          name: "Quinoa Bowl",
          image: "https://example.com/images/quinoa_bowl.jpg",
          amount: "1 bowl",
          calories: 380,
          carbs: 65,
          protein: 12,
          fats: 6
        }
      ];
      
      // Sample dinner items
      const dinnerItems = [
        {
          name: "Vegetable Stir Fry",
          image: "https://example.com/images/veg_stirfry.jpg",
          amount: "1 bowl",
          calories: 280,
          carbs: 30,
          protein: 8,
          fats: 12
        },
        {
          name: "Salmon Fillet",
          image: "https://example.com/images/salmon.jpg",
          amount: "4 oz",
          calories: 230,
          carbs: 0,
          protein: 25,
          fats: 15
        },
        {
          name: "Pasta with Tomato Sauce",
          image: "https://example.com/images/pasta.jpg",
          amount: "1 cup",
          calories: 220,
          carbs: 43,
          protein: 8,
          fats: 2
        }
      ];
      
      // Sample other items
      const otherItems = [
        {
          name: "Banana",
          image: "https://example.com/images/banana.jpg",
          amount: "1 medium",
          calories: 105,
          carbs: 27,
          protein: 1.3,
          fats: 0.3
        },
        {
          name: "Apple",
          image: "https://example.com/images/apple.jpg",
          amount: "1 medium",
          calories: 95,
          carbs: 25,
          protein: 0.5,
          fats: 0.3
        },
        {
          name: "Mixed Nuts",
          image: "https://example.com/images/mixed_nuts.jpg",
          amount: "1 oz",
          calories: 170,
          carbs: 6,
          protein: 5,
          fats: 15
        }
      ];
      
      // Add items to database
      for (const item of breakfastItems) {
        await addFoodItem('breakfast', {
          ...item,
          amount: item.amount
        });
      }
      
      for (const item of lunchItems) {
        await addFoodItem('lunch', {
          ...item,
          amount: item.amount
        });
      }
      
      for (const item of dinnerItems) {
        await addFoodItem('dinner', {
          ...item,
          amount: item.amount
        });
      }
      
      for (const item of otherItems) {
        await addFoodItem('other', {
          ...item,
          amount:item.amount
        });
      }
      
      return { success: true };
    } catch (error:any) {
      console.error("Error seeding food database:", error);
      return { success: false, error: error.message };
    }
  };
  
  export const seedDefaultExerciseDatabase = async () => {
    try {
      // Cardio exercises
      const cardioExercises = [
        {
          name: "Treadmill Running",
          caloriesPerMinute: 10,
          image: "https://example.com/images/treadmill.jpg",
          instructions: "Run at a moderate pace on the treadmill. Maintain a steady rhythm, land softly on your feet, and keep your arms relaxed at your sides."
        },
        {
          name: "Cycling",
          caloriesPerMinute: 8,
          image: "https://example.com/images/cycling.jpg",
          instructions: "Cycle at a moderate resistance level. Keep your back straight, engage your core, and maintain a steady cadence."
        },
        {
          name: "Elliptical",
          caloriesPerMinute: 8.5,
          image: "https://example.com/images/elliptical.jpg",
          instructions: "Use the elliptical machine at a moderate pace. Maintain an upright posture and move your arms and legs in sync."
        },
        {
          name: "Rowing Machine",
          caloriesPerMinute: 9,
          image: "https://example.com/images/rowing.jpg",
          instructions: "Row with proper form at a moderate intensity. Push with your legs, lean back slightly, then pull the handle toward your chest."
        }
      ];
      
      // Strength training exercises
      const strengthExercises = [
        {
          name: "Deadlifts",
          caloriesPerMinute: 6,
          image: "https://example.com/images/deadlift.jpg",
          instructions: "Perform deadlifts with proper form and appropriate weight. Keep your back straight, hinge at the hips, and lift with your legs."
        },
        {
          name: "Bench Press",
          caloriesPerMinute: 5,
          image: "https://example.com/images/bench_press.jpg",
          instructions: "Lie on the bench and press weight up from your chest. Keep your feet flat, engage your core, and lower the bar with control."
        },
        {
          name: "Squats",
          caloriesPerMinute: 7,
          image: "https://example.com/images/squat.jpg",
          instructions: "Perform squats with proper form and appropriate weight. Keep your chest up, back straight, and knees aligned with your toes."
        },
        {
          name: "Overhead Press",
          caloriesPerMinute: 5.5,
          image: "https://example.com/images/overhead_press.jpg",
          instructions: "Press weight overhead from shoulder height. Keep your core tight, elbows slightly forward, and avoid arching your back."
        }
      ];
      
      // Bodyweight exercises
      const bodyweightExercises = [
        {
          name: "Push-Ups",
          caloriesPerMinute: 7,
          image: "https://example.com/images/pushup.jpg",
          instructions: "Perform push-ups with proper form. Keep your body in a straight line, lower your chest to the floor, and push back up."
        },
        {
          name: "Squats",
          caloriesPerMinute: 6,
          image: "https://example.com/images/bodyweight_squat.jpg",
          instructions: "Perform bodyweight squats with proper form. Keep your feet shoulder-width apart and lower until your thighs are parallel to the ground."
        },
        {
          name: "Lunges",
          caloriesPerMinute: 6.5,
          image: "https://example.com/images/lunge.jpg",
          instructions: "Perform lunges with proper form. Step forward, lower your back knee toward the floor, and push back up to the starting position."
        },
        {
          name: "Plank",
          caloriesPerMinute: 4,
          image: "https://example.com/images/plank.jpg",
          instructions: "Hold plank position with proper form. Keep your body in a straight line, elbows under shoulders, and core engaged."
        }
      ];
      
      // Aerobic exercises
      const aerobicExercises = [
        {
          name: "Jumping Jacks",
          caloriesPerMinute: 8,
          image: "https://example.com/images/jumping_jacks.jpg",
          instructions: "Perform jumping jacks at a moderate pace. Jump with your feet apart while raising your arms overhead, then return to starting position."
        },
        {
          name: "High Knees",
          caloriesPerMinute: 9,
          image: "https://example.com/images/high_knees.jpg",
          instructions: "Run in place, bringing knees up to waist height. Keep your back straight and arms moving in rhythm with your legs."
        },
        {
          name: "Burpees",
          caloriesPerMinute: 10,
          image: "https://example.com/images/burpees.jpg",
          instructions: "Perform burpees with proper form. Squat down, kick your feet back into a plank, do a push-up, return feet to squat, and jump up."
        }
      ];
      
      
      // Add exercises to database
      for (const exercise of cardioExercises) {
        await addExercise('cardio', exercise);
      }
      
      for (const exercise of strengthExercises) {
        await addExercise('strength_training', exercise);
      }
      
      for (const exercise of bodyweightExercises) {
        await addExercise('bodyweight', exercise);
      }
      
      for (const exercise of aerobicExercises) {
        await addExercise('aerobic', exercise);
      }
      
      return { success: true };
    } catch (error:any) {
      console.error("Error seeding exercise database:", error);
      return { success: false, error: error.message };
    }
  };