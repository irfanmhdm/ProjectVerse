// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqzzJF_DLYeF-zFSFvUJrMZ5hD9fkeJJ0",
  authDomain: "projectverse7.firebaseapp.com",
  projectId: "projectverse7",
  storageBucket: "projectverse7.firebasestorage.app",
  messagingSenderId: "729205101493",
  appId: "1:729205101493:web:f5b6da0ae19d1b7516bffc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
