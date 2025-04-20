import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import FeatureScreens from '../components/FeatureScreens';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showFeatureScreens, setShowFeatureScreens] = useState(false);
  
  const user = auth.currentUser;
  
  const handleResendVerification = async () => {
    if (!user) return;
    
    try {
      setResending(true);
      await sendEmailVerification(user);
      Alert.alert(
        "Verification Email Sent",
        "Please check your inbox and follow the verification link.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      Alert.alert(
        "Error",
        "Failed to send verification email. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setResending(false);
    }
  };
  
  const handleFeatureScreensComplete = () => {
    // Feature screens are done, go to onboarding
    router.replace("/(auth)/onboarding");
  };

  const handleRefresh = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Force refresh the user token
      await user.reload();
      
      if (user.emailVerified) {
        // Email is now verified, check if user has a profile
        try {
          const userRef = doc(db, "userProfiles", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            // User has profile, go to home
            console.log("User has profile, going to home");
            router.replace("/(app)/home");
          } else {
            // User is logged in, email verified, but no profile:
            // Show feature screens before onboarding
            console.log("User verified but no profile, showing feature screens");
            setLoading(false);
            setShowFeatureScreens(true);
          }
        } catch (error) {
          console.error("Error checking Firestore user profile:", error);
          setLoading(false);
          setShowFeatureScreens(true);
        }
      } else {
        Alert.alert(
          "Not Verified",
          "Your email is not verified yet. Please check your inbox and follow the verification link.",
          [{ text: "OK" }]
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // Show feature screens if needed
  if (showFeatureScreens) {
    return <FeatureScreens onComplete={handleFeatureScreensComplete} />;
  }
  
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={require('../../assets/images/email-verification.png')}
          className="w-48 h-48 mb-8"
          resizeMode="contain"
        />
        
        <Text className="text-2xl font-bold mb-2 text-center text-gray-800">Verify Your Email</Text>
        <Text className="text-gray-600 mb-8 text-center">
          We've sent a verification email to {user?.email}. Please verify your email to continue using SmartFit.
        </Text>
        
        <TouchableOpacity 
          className="bg-orange-500 w-full py-4 rounded-xl mb-4 items-center"
          onPress={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold text-lg">I've Verified My Email</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-white border border-orange-500 w-full py-4 rounded-xl mb-4 items-center"
          onPress={handleResendVerification}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#f97316" />
          ) : (
            <Text className="text-orange-500 font-semibold text-lg">Resend Verification Email</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="mt-4"
          onPress={handleLogout}
        >
          <Text className="text-gray-500">Return to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 