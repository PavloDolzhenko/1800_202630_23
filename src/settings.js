import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme, saveTheme } from "./theme.js";

const darkModeToggle = document.getElementById("darkModeToggle");
const accountNote = document.getElementById("accountNote");
let currentUser = null;

darkModeToggle.checked = getTheme() === "dark";

// --[ Load settings from account ]--
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
        accountNote.innerHTML = '<a href="login.html" class="link">Log in</a> to save your settings to your account.';
        return;
    }

    accountNote.textContent = "Your settings are saved to your account.";

    try {
        const savedTheme = (await getDoc(doc(db, "users", user.uid))).data()?.settings?.theme;
        if (savedTheme) {
            saveTheme(savedTheme);
            darkModeToggle.checked = savedTheme === "dark";
        }
    } catch (error) {
        console.error(error);
    }
});

// --[ Dark mode switch ]--
darkModeToggle.addEventListener("change", async () => {
    const theme = darkModeToggle.checked ? "dark" : "light";
    saveTheme(theme);

    if (!currentUser) return;

    try {
        await setDoc(doc(db, "users", currentUser.uid), { settings: { theme: theme } }, { merge: true });
        accountNote.textContent = "Your settings are saved to your account.";
    } catch (error) {
        console.error(error);
        accountNote.textContent = "Couldn't save to your account right now, but it's still saved on this browser.";
    }
});
