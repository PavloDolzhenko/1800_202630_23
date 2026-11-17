// Pavlo : Ron this is our profile section. It only runs on profile.html.
// It loads the logged in person's info from Firestore, lets them change their username and saves it back.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { saveTheme } from "./theme.js";

