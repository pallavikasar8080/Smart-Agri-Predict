// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1yE-kR7nCfJG27MMW3N-D2dRZsxpLGgA",
  authDomain: "crop-9deb1.firebaseapp.com",
  projectId: "crop-9deb1",
  storageBucket: "crop-9deb1.firebasestorage.app",
  messagingSenderId: "65963245928",
  appId: "1:65963245928:web:8d06444a498314d78216dd",
  measurementId: "G-K92JVKH11F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
