import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function AppLayout() {
  const [refreshing, setRefreshing] = React.useState(false);
  const pathname = usePathname();
  
  // Determine if we're on the chat screen
  const isOnChatScreen = pathname === "/chat/index" || pathname === "/chat";
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "userProfiles", currentUser.uid));
        
          if (userDoc.exists()) {
            // Store user profile in AsyncStorage for faster access
            await AsyncStorage.setItem(
              `userProfile_${currentUser.uid}`, 
              JSON.stringify(userDoc.data())
            );
            // Mark onboarding as complete
            await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
          } else {
            console.log('No user profile found!');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            height: 70,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            paddingBottom: 10,
            display: isOnChatScreen ? 'none' : 'flex', // Hide tab bar on chat screen
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#8A2BE2',
          tabBarInactiveTintColor: '#777',
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="fitness/index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="add/index"
          options={{    
            tabBarIcon: ({ color }) => (
              <View className="w-16 h-16 bg-primary rounded-full items-center justify-center bottom-5 shadow-lg shadow-primary/50">
                <Ionicons name="add" color="white" size={32} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="stats/index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity/index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="walk" color={color} size={size} />
            ),
          }}
        />
        
        {/* Hidden nested routes */}
        <Tabs.Screen 
          name="fitness/category/[id]" 
          options={{
            href: null,
          }}
        />
        <Tabs.Screen 
          name="profile/index" 
          options={{
            href: null,
          }}
        />
        <Tabs.Screen 
          name="chat/index" 
          options={{
            href: null,
            tabBarStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen 
          name="fitness/workout/[id]" 
          options={{
            href: null,
          }}
        />
        <Tabs.Screen 
          name="add/camera/index" 
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}