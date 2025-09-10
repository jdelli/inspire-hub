// src/firebase-config.js
import { initializeApp } from "firebase/app";
import{ getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQ9aRLY9fHnfEdqVXEnAn0TwNIFl9eE3w",
  authDomain: "i-hub-a74fb.firebaseapp.com",
  projectId: "i-hub-a74fb",
  storageBucket: "i-hub-a74fb.firebasestorage.app",
  messagingSenderId: "646360221002",
  appId: "1:646360221002:web:bc54e3cfd12734a45bedb3",
};



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, app};