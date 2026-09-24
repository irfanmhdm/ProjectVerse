// =========================================================
// FIREBASE CONFIGURATION
// =========================================================

import { initializeApp } from "firebase/app";

import {
  initializeAuth,
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFirestore } from "firebase/firestore";


// =========================================================
// FIREBASE CONFIG
// =========================================================

const firebaseConfig = {
  apiKey: "AIzaSyAqzzJF_DLYeF-zFSFvUJrMZ5hD9fkeJJ0",
  authDomain: "projectverse7.firebaseapp.com",
  projectId: "projectverse7",
  storageBucket: "projectverse7.firebasestorage.app",
  messagingSenderId: "729205101493",
  appId: "1:729205101493:web:f5b6da0ae19d1b7516bffc",
};


// =========================================================
// INITIALIZE FIREBASE
// =========================================================

const app = initializeApp(firebaseConfig);


// =========================================================
// REACT NATIVE AUTH PERSISTENCE
// =========================================================

// Firebase 12.x does not expose this correctly
// through TypeScript's firebase/auth definition.
//
// We access the function from the Firebase Auth module
// at runtime.

import * as firebaseAuth from "firebase/auth";

const getReactNativePersistence =
  (firebaseAuth as any).getReactNativePersistence;


// =========================================================
// INITIALIZE AUTH
// =========================================================

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});


// =========================================================
// FIRESTORE
// =========================================================

export const db = getFirestore(app);