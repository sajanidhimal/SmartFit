import { useEffect } from 'react';
import { Redirect } from 'expo-router';


export default function Index() {
  // In a real app, you would check if user is logged in here
  const isLoggedIn = true; // Mock for now
  
  // Redirect to the appropriate stack
  if (isLoggedIn) {
    return <Redirect href="/(app)/home" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}