import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyC1ham7672qW9ERsvpkyJJSvMfaKL_lWFk",
  authDomain: "games-66e69.firebaseapp.com",
  databaseURL: "https://games-66e69-default-rtdb.firebaseio.com",
  projectId: "games-66e69",
  storageBucket: "games-66e69.firebasestorage.app",
  messagingSenderId: "502745086661",
  appId: "1:502745086661:web:9770b5e7b7e3d9abb70eac",
  measurementId: "G-KTBVRM92L8"
};

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
