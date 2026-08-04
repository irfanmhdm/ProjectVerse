import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAqzzJF_DLYeF-zFSFvUJrMZ5hD9fkeJJ0",
  authDomain: "projectverse7.firebaseapp.com",
  projectId: "projectverse7",
  storageBucket: "projectverse7.firebasestorage.app",
  messagingSenderId: "729205101493",
  appId: "1:729205101493:web:f5b6da0ae19d1b7516bffc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);