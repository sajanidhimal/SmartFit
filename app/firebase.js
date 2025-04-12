// app/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';


//   apiKey: "AIzaSyDumKT3qb3tg13Jvfe4TsaT57W9B3jjmhg",
//   authDomain: "smartfit-4b0b4.firebaseapp.com",
//   projectId: "smartfit-4b0b4",
//   storageBucket: "smartfit-4b0b4.appspot.com",
//   messagingSenderId: "703344364199",
//   appId: "1:703344364199:web:2e220c341b88efafcf2982",
//   measurementId: "G-TV8KKD8LPY"
// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAfqwesAbpuzOqCBnwXB1vVIBikk0Ah46E",
    authDomain: "smart-fit-7989f.firebaseapp.com",
    projectId: "smart-fit-7989f",
    storageBucket: "smart-fit-7989f.firebasestorage.app",
    messagingSenderId: "972886141553",
    appId: "1:972886141553:web:8a430e4bf217d1719249d0",
    measurementId: "G-P4EJ1VSB0N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db, app };