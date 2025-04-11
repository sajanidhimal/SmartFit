//app/(steps)/index.tsx
// This is a simple step tracking app using React Native and Expo
// It uses the Accelerometer to detect steps and tracks daily and weekly progress
// It also uses AsyncStorage to save and load step data

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, EmitterSubscription } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StepTrackerApp() {
  const [steps, setSteps] = useState(0);
  const [goal] = useState(6000);
  const [calories, setCalories] = useState(0);
  const [distance, setDistance] = useState(0);
  const [weekProgress, setWeekProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [isTracking, setIsTracking] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [lastMagnitude, setLastMagnitude] = useState(0);
  const [subscription, setSubscription] = useState<EmitterSubscription | null>(null);
  const [stepDetected, setStepDetected] = useState(false);

  // Step detection thresholds
  const STEP_THRESHOLD = 1.2; // Minimum acceleration to count as a step
  const STEP_DELAY = 250; // Minimum time between steps in ms
  const STEP_LENGTH = 0.75; // Average step length in meters
  const CALORIES_PER_STEP = 0.05; // Average calories burned per step

  // Progress circle parameters
  const radius = 80;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;
  const progress = steps / goal;

  // Load saved data on app start
  useEffect(() => {
    loadSavedData();
  }, []);

  // Save data when steps change
  useEffect(() => {
    if (steps > 0) {
      saveStepData();
    }
  }, [steps]);

  // Load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      // Get today's date string
      const today = new Date().toISOString().split('T')[0];
      
      // Load step data
      const savedSteps = await AsyncStorage.getItem(`steps_${today}`);
      if (savedSteps !== null) {
        const stepsValue = parseInt(savedSteps);
        setSteps(stepsValue);
        setCalories(Math.round(stepsValue * CALORIES_PER_STEP));
        setDistance(parseFloat((stepsValue * STEP_LENGTH / 1000).toFixed(2)));
      }
      
      // Load weekly progress
      const weeklyData = await AsyncStorage.getItem('weekly_progress');
      if (weeklyData !== null) {
        setWeekProgress(JSON.parse(weeklyData));
      }
    } catch (error) {
      console.error('Failed to load saved data', error);
    }
  };

  // Save step data to AsyncStorage
  const saveStepData = async () => {
    try {
      // Get today's date string
      const today = new Date().toISOString().split('T')[0];
      
      // Save today's steps
      await AsyncStorage.setItem(`steps_${today}`, steps.toString());
      
      // Update weekly progress
      const dayOfWeek = new Date().getDay(); // 0 is Sunday, 6 is Saturday
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 where 0 is Monday
      
      const newWeekProgress = [...weekProgress];
      newWeekProgress[adjustedDay] = steps / goal; // Save progress as a ratio
      
      await AsyncStorage.setItem('weekly_progress', JSON.stringify(newWeekProgress));
      setWeekProgress(newWeekProgress);
    } catch (error) {
      console.error('Failed to save step data', error);
    }
  };

  // Toggle step tracking
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Start step tracking
  const startTracking = async () => {
    try {
      // Check and request permissions
      if (Platform.OS === 'ios') {
        const { granted } = await Accelerometer.requestPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission Error",
            "We need sensor access to count your steps.",
            [{ text: "OK" }]
          );
          return;
        }
      }
      
      setIsTracking(true);
      
      Accelerometer.setUpdateInterval(100);
      const subscription = Accelerometer.addListener(data => {
        setAccelerometerData(data);
        detectStep(data);
      });
      setSubscription(subscription);
      
      Alert.alert("Step Tracking", "Started tracking your steps!");
    } catch (error) {
      Alert.alert("Error", "Failed to start step tracking: " + error.message);
    }
  };

  // Stop step tracking
  const stopTracking = () => {
    subscription && subscription.remove();
    setSubscription(null);
    setIsTracking(false);
    Alert.alert("Step Tracking", "Stopped tracking your steps!");
  };

  // Step detection algorithm
  const detectStep = (data) => {
    // Calculate the magnitude of acceleration
    const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // Detect a step when acceleration crosses threshold
    if (!stepDetected && magnitude > STEP_THRESHOLD && magnitude - lastMagnitude > 0.3) {
      setStepDetected(true);
      setSteps(prevSteps => {
        const newSteps = prevSteps + 1;
        // Update calories and distance based on steps
        setCalories(Math.round(newSteps * CALORIES_PER_STEP));
        setDistance(parseFloat((newSteps * STEP_LENGTH / 1000).toFixed(2)));
        return newSteps;
      });
      
      // Reset step detection after delay
      setTimeout(() => {
        setStepDetected(false);
      }, STEP_DELAY);
    }
    
    setLastMagnitude(magnitude);
  };

  // Convert progress to SVG arc parameters
  const getProgressPath = () => {
    const angle = 2 * Math.PI * progress;
    const x = radius * Math.sin(angle);
    const y = -radius * Math.cos(angle);
    
    // Create an arc path from 0 to the progress angle
    return `M 0 -${radius} A ${radius} ${radius} 0 ${progress > 0.5 ? 1 : 0} 1 ${x} ${y}`;
  };

  // Render day of week labels
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF9500" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Steps</Text>
      </View>

      <View style={styles.circleContainer}>
        <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth} viewBox={`-${radius + strokeWidth/2} -${radius + strokeWidth/2} ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
          {/* Background circle */}
          <Circle
            cx="0"
            cy="0"
            r={radius}
            stroke="#EAEAEA"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress arc */}
          <Path
            d={getProgressPath()}
            stroke="#FF9500"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.stepsTextContainer}>
          <Text style={styles.stepsLabel}>Steps</Text>
          <Text style={styles.stepsValue}>{steps}</Text>
          <Text style={styles.stepsGoal}>/{goal}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={24} color="#FF9500" />
          <Text style={styles.statValue}>{calories}</Text>
          <Text style={styles.statUnit}>kcal</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="location" size={24} color="#6200EE" />
          <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
      </View>

      {/* Start Tracking Button */}
      <TouchableOpacity style={styles.trackingButton} onPress={toggleTracking}>
        <Text style={styles.trackingButtonText}>
          {isTracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <View style={styles.weekProgress}>
          {weekProgress.map((day, index) => (
            <View key={index} style={styles.dayProgress}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { height: `${day * 100}%`, backgroundColor: index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) ? '#FFCB66' : '#FF9500' }]} />
              </View>
              <Text style={styles.dayLabel}>{days[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="barbell-outline" size={24} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#6200EE" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 60,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    position: 'relative',
  },
  stepsTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  stepsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  stepsGoal: {
    fontSize: 16,
    color: '#888',
  },
  trackingButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
    marginRight: 2,
  },
  statUnit: {
    fontSize: 14,
    color: '#888',
  },
  progressContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 100, // Add space for tab bar
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 15,
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
  },
  dayProgress: {
    alignItems: 'center',
    width: 35,
  },
  progressBarContainer: {
    height: 80,
    width: 10,
    backgroundColor: '#EAEAEA',
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressBar: {
    width: '100%',
    borderRadius: 5,
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 12,
    color: '#888',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});

