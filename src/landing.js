import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// --[ Greeting ]--
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        location.href = "index.html";
        return;
    }

    const data = (await getDoc(doc(db, "users", user.uid))).data() || {};
    document.getElementById("userName").textContent = data.username || data.firstName || user.email;
});
