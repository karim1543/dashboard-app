import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiGJxNgjFusm5qv10OQ2VvbWOy4cBkEEc",
  authDomain: "dashboard-29b1b.firebaseapp.com",
  databaseURL: "https://dashboard-29b1b-default-rtdb.firebaseio.com",
  projectId: "dashboard-29b1b",
  storageBucket: "dashboard-29b1b.firebasestorage.app",
  messagingSenderId: "1096267388766",
  appId: "1:1096267388766:web:3d8808e7f62c1ae36061cf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);