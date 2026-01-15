// src/firebase/index.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ต้องมีบรรทัดนี้

// Config เดิมของคุณเป้ง
const firebaseConfig = {
  apiKey: "AIzaSyAXJOmewNfAMmjgS9Gwq_ciVk-lYS21AQU",
  authDomain: "salespilot-c9cd1.firebaseapp.com",
  projectId: "salespilot-c9cd1",
  storageBucket: "salespilot-c9cd1.firebasestorage.app",
  messagingSenderId: "676627817045",
  appId: "1:676627817045:web:81ca137124c4f016eb6adc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app); // สร้างตัวเชื่อมต่อ Database

// สำคัญที่สุด: ต้อง export ออกไปให้ไฟล์อื่นใช้
export { auth, db };