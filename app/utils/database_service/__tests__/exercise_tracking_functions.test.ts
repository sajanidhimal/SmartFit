import { logExercise, logSteps, getExerciseByDate, deleteExercise } from '../exercise_tracking_functions';
import { Timestamp } from 'firebase/firestore';

// Mock firebase modules
jest.mock('@/app/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  
  // Create a Timestamp class that mimics the Firebase Timestamp
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }
    
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }
    
    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
    
    toDate() {
      return new Date(this.seconds * 1000);
    }
  }
  
  return {
    ...originalModule,
    getFirestore: jest.fn(),
    collection: jest.fn(() => ({})),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    getDocs: jest.fn(() => 
      Promise.resolve({
        forEach: (callback: (doc: any) => void) => {
          const mockDocs = [
            {
              id: 'exercise-1',
              data: () => ({
                type: 'running',
                caloriesBurned: 350,
                date: new MockTimestamp(1630000000, 0),
                duration: 30
              })
            },
            {
              id: 'exercise-2',
              data: () => ({
                type: 'steps',
                caloriesBurned: 120,
                date: new MockTimestamp(1630050000, 0),
                steps: 3000
              })
            }
          ];
          
          mockDocs.forEach(callback);
        }
      })
    ),
    doc: jest.fn(() => ({})),
    deleteDoc: jest.fn(() => Promise.resolve()),
    query: jest.fn(() => ({})),
    where: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    Timestamp: MockTimestamp,
    serverTimestamp: jest.fn(() => new MockTimestamp(1630000000, 0))
  };
});

describe('Exercise Tracking Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('logExercise', () => {
    it('should log exercise successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const exerciseData = {
        type: 'running',
        caloriesBurned: 350,
        date: Timestamp.now(),
        duration: 30,
        category: 'cardio'
      };
      
      // Act
      const result = await logExercise(userId, exerciseData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe('mock-doc-id');
    });
    
    it('should handle errors when logging exercise', async () => {
      // Arrange
      const userId = 'test-user-id';
      const exerciseData = {
        type: 'running',
        caloriesBurned: 350,
        date: Timestamp.now()
      };
      
      // Mock addDoc to throw an error
      const addDoc = require('firebase/firestore').addDoc;
      addDoc.mockImplementationOnce(() => Promise.reject(new Error('Firestore error')));
      
      // Act
      const result = await logExercise(userId, exerciseData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore error');
    });
  });
  
  describe('logSteps', () => {
    it('should log steps successfully and calculate calories', async () => {
      // Arrange
      const userId = 'test-user-id';
      const stepsData = {
        steps: 5000
      };
      
      // Act
      const result = await logSteps(userId, stepsData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe('mock-doc-id');
    });
  });
  
  describe('getExerciseByDate', () => {
    it('should fetch exercises for a date range', async () => {
      // Arrange
      const userId = 'test-user-id';
      const startDate = Timestamp.fromDate(new Date('2021-08-26'));
      const endDate = Timestamp.fromDate(new Date('2021-08-27'));
      
      // Act
      const result = await getExerciseByDate(userId, startDate, endDate);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].type).toBe('running');
      expect(result.data?.[1].type).toBe('steps');
    });
  });
  
  describe('deleteExercise', () => {
    it('should delete an exercise successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const exerciseId = 'exercise-1';
      
      // Act
      const result = await deleteExercise(userId, exerciseId);
      
      // Assert
      expect(result.success).toBe(true);
    });
    
    it('should handle errors when deleting an exercise', async () => {
      // Arrange
      const userId = 'test-user-id';
      const exerciseId = 'non-existent-id';
      
      // Mock deleteDoc to throw an error
      const deleteDoc = require('firebase/firestore').deleteDoc;
      deleteDoc.mockImplementationOnce(() => Promise.reject(new Error('Document not found')));
      
      // Act
      const result = await deleteExercise(userId, exerciseId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });
  });
}); 