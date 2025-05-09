import { getDailySummary, getWeeklySummary } from '../summary_functions';
import { Timestamp } from 'firebase/firestore';
import { getFoodIntakeByDate } from '../calorie_intake_functions';
import { getExerciseByDate } from '../exercise_tracking_functions';
import { getUserProfile } from '../profile_functions';

// Mock the dependent functions
jest.mock('../calorie_intake_functions', () => ({
  getFoodIntakeByDate: jest.fn()
}));

jest.mock('../exercise_tracking_functions', () => ({
  getExerciseByDate: jest.fn()
}));

jest.mock('../profile_functions', () => ({
  getUserProfile: jest.fn()
}));

describe('Summary Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailySummary', () => {
    it('should calculate daily summary correctly', async () => {
      // Arrange
      const userId = 'test-user-id';
      const testDate = new Date('2023-01-15');
      
      // Mock food intake data
      (getFoodIntakeByDate as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          { 
            mealType: 'breakfast',
            foodName: 'Oatmeal',
            calories: 300,
            carbs: 60,
            protein: 10,
            fats: 5
          },
          {
            mealType: 'lunch',
            foodName: 'Chicken Salad',
            calories: 450,
            carbs: 20,
            protein: 40,
            fats: 25
          }
        ]
      });
      
      // Mock exercise data
      (getExerciseByDate as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            type: 'running',
            caloriesBurned: 350,
            duration: 30
          },
          {
            type: 'steps',
            caloriesBurned: 150,
            steps: 6000
          }
        ]
      });
      
      // Mock user profile
      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          gender: 'male',
          height: 180,
          weight: 75,
          age: 30,
          activityLevel: 'moderately_active'
        }
      });
      
      // Act
      const result = await getDailySummary(userId, testDate);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        // Check calories
        expect(result.data.totalCaloriesIn).toBe(750); // 300 + 450
        expect(result.data.totalCaloriesOut).toBe(500); // 350 + 150
        
        // Check nutrition totals
        expect(result.data.nutrition.carbs).toBe(80); // 60 + 20
        expect(result.data.nutrition.protein).toBe(50); // 10 + 40
        expect(result.data.nutrition.fats).toBe(30); // 5 + 25
        
        // BMR calculation check (approximate)
        expect(result.data.bmr).toBeGreaterThan(1500);
        expect(result.data.bmr).toBeLessThan(2000);
        
        // TDEE check
        expect(result.data.tdee).toBeGreaterThan(result.data.bmr);
        
        // Verify intake and exercise breakdown arrays
        expect(result.data.intakeBreakdown).toHaveLength(2);
        expect(result.data.exerciseBreakdown).toHaveLength(2);
      }
    });
    
    it('should handle missing user profile', async () => {
      // Arrange
      const userId = 'test-user-id';
      const testDate = new Date('2023-01-15');
      
      // Mock food and exercise data
      (getFoodIntakeByDate as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      });
      
      (getExerciseByDate as jest.Mock).mockResolvedValue({
        success: true,
        data: []
      });
      
      // Mock user profile not found
      (getUserProfile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'User not found'
      });
      
      // Act
      const result = await getDailySummary(userId, testDate);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User profile not found');
    });
  });
  
  describe('getWeeklySummary', () => {
    it('should aggregate daily summaries for a week', async () => {
      // Arrange
      const userId = 'test-user-id';
      const startDate = new Date('2023-01-15');
      
      // Mock getDailySummary to return a success response
      // Simulate this by mocking implementation directly
      const mockDailySummary = jest.fn().mockImplementation((userId, date) => {
        return Promise.resolve({
          success: true,
          data: {
            date,
            totalCaloriesIn: 2000,
            totalCaloriesOut: 500,
            bmr: 1700,
            tdee: 2500,
            netCalories: -1000,
            nutrition: {
              carbs: 200,
              protein: 100,
              fats: 80,
            },
            intakeBreakdown: [],
            exerciseBreakdown: [],
          }
        });
      });
      
      // Temporarily replace the real function
      const originalGetDailySummary = require('../summary_functions').getDailySummary;
      require('../summary_functions').getDailySummary = mockDailySummary;
      
      // Act
      const result = await getWeeklySummary(userId, startDate);
      
      // Restore original function after test
      require('../summary_functions').getDailySummary = originalGetDailySummary;
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(7); // 7 days in a week
      
      // Verify each day has the expected structure
      if (result.data) {
        result.data.forEach(day => {
          expect(day.totalCaloriesIn).toBe(2000);
          expect(day.totalCaloriesOut).toBe(500);
          expect(day.tdee).toBe(2500);
        });
      }
      
      // Verify the mock was called 7 times (once per day)
      expect(mockDailySummary).toHaveBeenCalledTimes(7);
    });
    
    it('should handle errors in daily summary calculation', async () => {
      // Arrange
      const userId = 'test-user-id';
      const startDate = new Date('2023-01-15');
      
      // Mock getDailySummary to throw an error
      const mockDailySummary = jest.fn().mockImplementation(() => {
        throw new Error('Daily summary calculation error');
      });
      
      // Temporarily replace the real function
      const originalGetDailySummary = require('../summary_functions').getDailySummary;
      require('../summary_functions').getDailySummary = mockDailySummary;
      
      // Act
      const result = await getWeeklySummary(userId, startDate);
      
      // Restore original function after test
      require('../summary_functions').getDailySummary = originalGetDailySummary;
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Daily summary calculation error');
    });
  });
}); 