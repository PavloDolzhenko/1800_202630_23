// Pavlo : Ron this file connects our site to Firebase.
// Any page that needs login or the database imports "auth" or "db" from here.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Pavlo : Ron these values come from the .env file (Vite only reads names that start with VITE_).
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);       // Pavlo - login / sign up / log out
export const db = getFirestore(app);    // Pavlo - the Firestore database
