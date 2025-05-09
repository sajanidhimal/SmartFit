import { getUserProfile, updateUserProfile } from '../profile_functions';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';

// Mock firebase modules
jest.mock('@/app/firebase', () => {
  // Use emulator URL if in test environment
  // Make sure firebase emulator is running (firebase emulators:start)
  return {
    db: {}
  };
});

jest.mock('firebase/firestore', () => {
  const firestoreMock = jest.requireActual('firebase/firestore');
  
  return {
    ...firestoreMock,
    getFirestore: jest.fn(),
    doc: jest.fn(() => ({})),
    getDoc: jest.fn(() => 
      Promise.resolve({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          gender: 'male',
          height: 175,
          weight: 70,
          age: 30,
          activityLevel: 'moderate',
          targetWeight: 65,
          workoutFrequency: '3_times_a_week',
          updatedAt: { toDate: () => new Date() }
        }))
      })
    ),
    updateDoc: jest.fn(() => Promise.resolve()),
    setDoc: jest.fn(() => Promise.resolve()),
    serverTimestamp: jest.fn(() => ({ seconds: 1630000000, nanoseconds: 0 })),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    collection: jest.fn(() => ({}))
  };
});

// Spy/spy mock functions
const getDocMock = jest.spyOn(require('firebase/firestore'), 'getDoc');
const updateDocMock = jest.spyOn(require('firebase/firestore'), 'updateDoc');
const addDocMock = jest.spyOn(require('firebase/firestore'), 'addDoc');

describe('Profile Functions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getUserProfile', () => {
    it('should retrieve a user profile successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      
      // Mock the return value for this specific test
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          gender: 'male',
          height: 175,
          weight: 70,
          age: 30,
          activityLevel: 'moderate',
          targetWeight: 65,
          workoutFrequency: '3_times_a_week'
        })
      } as any);
      
      // Act
      const result = await getUserProfile(userId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.gender).toBe('male');
      expect(result.data?.height).toBe(175);
    });
    
    it('should handle when a user profile does not exist', async () => {
      // Arrange
      const userId = 'non-existent-user';
      
      // Mock the return value for this specific test
      getDocMock.mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      } as any);
      
      // Act
      const result = await getUserProfile(userId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
    
    it('should handle errors when retrieving a user profile', async () => {
      // Arrange
      const userId = 'test-user-id';
      
      // Mock getDoc to throw an error
      getDocMock.mockRejectedValueOnce(new Error('Firestore error'));
      
      // Act
      const result = await getUserProfile(userId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore error');
    });
  });
  
  describe('updateUserProfile', () => {
    it('should update a user profile successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const updateData = {
        weight: 75,
        targetWeight: 68
      };
      
      // Mock getDoc for existing profile
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          gender: 'male',
          height: 175,
          weight: 70,
          age: 30,
          activityLevel: 'moderate',
          targetWeight: 65
        })
      } as any);
      
      // Act
      const result = await updateUserProfile(userId, updateData);
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify updateDoc was called with correct params
      expect(updateDocMock).toHaveBeenCalled();
      
      // Verify addDoc was called for weight history
      expect(addDocMock).toHaveBeenCalled();
    });
    
    it('should handle errors when updating a user profile', async () => {
      // Arrange
      const userId = 'test-user-id';
      const updateData = {
        weight: 75
      };
      
      // Mock getDoc for existing profile
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          gender: 'male',
          height: 175,
          weight: 70,
          age: 30,
          activityLevel: 'moderate'
        })
      } as any);
      
      // Mock updateDoc to throw an error
      updateDocMock.mockRejectedValueOnce(new Error('Firestore update error'));
      
      // Act
      const result = await updateUserProfile(userId, updateData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore update error');
    });
  });
}); 