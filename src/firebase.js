// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBAMuILBD7HVd3a98c210RudFdQJK1ZAbo",
  authDomain: "fin-select.firebaseapp.com",
  projectId: "fin-select",
  storageBucket: "fin-select.firebasestorage.app",
  messagingSenderId: "972523472064",
  appId: "1:972523472064:web:f8e20e42d501f286789925",
  measurementId: "G-J1EXF7MHYY",
  databaseURL: "https://fin-select-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dbRT = getDatabase(app);
