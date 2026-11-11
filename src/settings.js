// Pavlo : Ron this is our settings section. It only runs on settings.html.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme, saveTheme } from "./theme.js";

const darkModeToggle = document.getElementById("darkModeToggle");
const accountNote = document.getElementById("accountNote");
const backBtn = document.getElementById("backBtn");

let currentUser = null;   // Pavlo - stays null if nobody is logged in


// Pavlo - puts the switch in the right spot when the page opens (ON if dark mode is already on)
darkModeToggle.checked = getTheme() === "dark";


// Pavlo : Ron make sure you understand this one. Firebase takes a second to check if someone is logged in.
// If they are, we load the settings saved on their account (users/<their user id> -> settings),
// so dark mode follows them to any computer. If not, the settings just stay on this browser.
onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
        accountNote.innerHTML = '<a href="login.html">Log in</a> to save your settings to your account.';
        return;
    }

    accountNote.textContent = "Your settings are saved to your account.";

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const savedTheme = userDoc.data()?.settings?.theme;   // Pavlo - ?. means "undefined if it's not there yet" instead of crashing

        if (savedTheme) {
            saveTheme(savedTheme);
            darkModeToggle.checked = savedTheme === "dark";
        }
    } catch (error) {
        console.error(error);
    }
});


// Pavlo : Ron this is what runs when you flip the Dark Mode switch.
// The colours change straight away on this browser, then if you're logged in it also saves it to Firestore.
darkModeToggle.addEventListener("change", async () => {
    const theme = darkModeToggle.checked ? "dark" : "light";
    saveTheme(theme);

    if (!currentUser) {
        return;
    }

    try {
        // Pavlo - merge: true only changes settings.theme, the rest of their document (name, username...) stays the same
        await setDoc(doc(db, "users", currentUser.uid), { settings: { theme: theme } }, { merge: true });
        accountNote.textContent = "Your settings are saved to your account.";
    } catch (error) {
        console.error(error);
        accountNote.textContent = "Couldn't save to your account right now, but it's still saved on this browser.";
    }
});


// Pavlo : Ron this takes care of the Back button. If you came to Settings from one of our pages
// it sends you back to that same page. If not (like someone opened settings.html straight away)
// the href="index.html" on the button just sends them Home.
backBtn.addEventListener("click", (event) => {
    if (document.referrer.startsWith(window.location.origin)) {
        event.preventDefault();   // Pavlo - stops it from going to index.html
        history.back();
    }
});
