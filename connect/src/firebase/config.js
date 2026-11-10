import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBKxUkC-b8aMcLJLJHhPnsUPghljca1uyo",
  authDomain: "mystic-now-482206-r1.firebaseapp.com",
  projectId: "mystic-now-482206-r1",
  storageBucket: "mystic-now-482206-r1.firebasestorage.app",
  messagingSenderId: "224254941494",
  appId: "1:224254941494:web:9eb49923a4e2027d6a7b97"
};

// Initialize Firebase once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;

