import { NativeModules } from 'react-native';

// Mock the Expo vector icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: View,
    MaterialIcons: View,
    FontAwesome: View,
    // Add other icon sets as needed
  };
});

// Mock SVG components
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    Svg: View,
    Circle: View,
    Rect: View,
    Path: View,
    // Add other SVG components as needed
  };
});

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo modules if they're used in tested components
NativeModules.ExponentConstants = {
  statusBarHeight: 0,
};

// Set up global variables required by React Native
global.__reanimatedWorkletInit = jest.fn();

// This is to silence the warnings from react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
}); 