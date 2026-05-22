import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-a853a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-a853a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-a853a.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1",
};

// burası firebase'i başlattığımız yer
const app = initializeApp(firebaseConfig);

// burda da fcm bağlantısını kuruyoruz
export const messaging = getMessaging(app);

// token için lazım olan anahtar
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "2FedZpDBJhzZUWZsxCGv2YG0WLvjNmD86jRklE-zJjg";
