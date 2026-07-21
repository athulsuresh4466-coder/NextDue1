import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

const withoutEmptyValues = (config) =>
  Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );

const getFirebaseConfig = () => {
  const envConfig = withoutEmptyValues({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });

  const appJsonConfig = Constants.expoConfig?.extra?.firebase || {};

  const fallbackConfig = {
    apiKey: "AIzaSyAF0Dn1pRA3oiJK1CBY-uL4xROt-IYCB24",
    authDomain: "nextdues.firebaseapp.com",
    projectId: "nextdues",
    storageBucket: "nextdues.firebasestorage.app",
    messagingSenderId: "586749989494",
    appId: "1:586749989494:web:5902193842090139810557",
    measurementId: "G-DMWLWW6KRK",
  };

  return {
    ...fallbackConfig,
    ...appJsonConfig,
    ...envConfig,
  };
};

const firebaseConfig = getFirebaseConfig();

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);

if (Platform.OS === "web") {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };