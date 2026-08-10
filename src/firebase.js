// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgx9WhUA6HnhE8SVNoNuE4G98eEbseMHc",
  authDomain: "japan-425ce.firebaseapp.com",
  projectId: "japan-425ce",
  storageBucket: "japan-425ce.firebasestorage.app",
  messagingSenderId: "999925579421",
  appId: "1:999925579421:web:fd7ba46c4e405c1e4c1e74",
  measurementId: "G-C64P5BP950",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
