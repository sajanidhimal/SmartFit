import { useContext } from 'react';
import { NutritionContext } from '@/app/(app)/home';

// Custom hook to access the NutritionContext
export function useNutrition() {
  const context = useContext(NutritionContext);
  
  if (!context) {
    console.warn('useNutrition must be used within a NutritionContext.Provider');
    // Return a no-op function if used outside context to prevent crashes
    return {
      notifyFoodAdded: () => {}
    };
  }
  
  return context;
} 