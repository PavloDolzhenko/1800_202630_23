import "./theme.js";
import "./nav.js";
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";

// --[ Send logged in users from index to landing ]--
const onIndexPage = location.pathname.endsWith("index.html") || location.pathname.endsWith("/");

if (onIndexPage) {
    onAuthStateChanged(auth, (user) => {
        if (user) location.href = "landing.html";
    });
}
