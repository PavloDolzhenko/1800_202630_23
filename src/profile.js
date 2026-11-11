// Pavlo : Ron this is our profile section. It only runs on profile.html.
// It loads the logged in person's info from Firestore, lets them change their username and saves it back.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { saveTheme } from "./theme.js";

// Grab the parts of the page we need
const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const alertBox = document.getElementById("profileAlert");
const backBtn = document.getElementById("backBtn");

let currentUser = null;
let savedUsername = "";   // Pavlo - the username that's in Firestore right now (Reset puts this back)


// Pavlo - shows a message in the grey box (same as the login page)
function showMessage(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideMessage() {
    alertBox.classList.add("d-none");
}

// Pavlo - turns editing on or off. When it's off you can't type in the box or press Save / Reset.
function setEditing(isEditing) {
    usernameInput.disabled = !isEditing;
    saveBtn.disabled = !isEditing;
    resetBtn.disabled = !isEditing;
}


// Pavlo : Ron make sure you understand this one. Firebase takes a second to check if someone is logged in,
// so this waits for it. If nobody is logged in it sends them to the login page.
// If they are, it grabs their document from Firestore (users/<their user id>) and fills in the page.
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    emailInput.value = user.email;   // Pavlo - the email comes from their login, not from Firestore

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data() || {};   // Pavlo - empty {} if they don't have a document yet

        savedUsername = data.username || "";
        usernameInput.value = savedUsername;

        // Pavlo - if they saved dark mode on their account, use it here too
        if (data.settings?.theme) {
            saveTheme(data.settings.theme);
        }

        editBtn.disabled = false;
    } catch (error) {
        console.error(error);
        showMessage("Couldn't load your profile. Please refresh the page and try again.");
    }
});


// Pavlo - Edit (pencil) button: unlocks the username box so you can type
editBtn.addEventListener("click", () => {
    hideMessage();
    setEditing(true);
    usernameInput.focus();
});

// Pavlo - Reset button: puts the username back to what's saved and locks it again
resetBtn.addEventListener("click", () => {
    hideMessage();
    usernameInput.value = savedUsername;
    setEditing(false);
});


// Pavlo : Ron this runs when Save is pressed. The browser already checked the username rules
// from profile.html before we get here, so this just saves it to Firestore.
profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();   // Pavlo - stops the page from reloading
    hideMessage();

    const username = usernameInput.value;
    saveBtn.disabled = true;   // Pavlo - so it can't be clicked twice while Firebase is working

    try {
        // Pavlo - merge: true only changes the username, everything else in their document stays the same
        await setDoc(doc(db, "users", currentUser.uid), { username: username }, { merge: true });

        savedUsername = username;
        setEditing(false);
        showMessage("Profile saved!");
    } catch (error) {
        console.error(error);
        showMessage("Couldn't save your profile. Please try again.");
        saveBtn.disabled = false;
    }
});


// Pavlo : Ron this is the Log Out button. It signs them out of Firebase and sends them to the login page.
logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error(error);
        showMessage("Couldn't log out. Please try again.");
        logoutBtn.disabled = false;
    }
});


// Pavlo : Ron this takes care of the Back button. If you came to Profile from one of our pages
// it sends you back to that same page. If not (like someone opened profile.html straight away)
// the href="index.html" on the button just sends them Home.
backBtn.addEventListener("click", (event) => {
    if (document.referrer.startsWith(window.location.origin)) {
        event.preventDefault();   // Pavlo - stops it from going to index.html
        history.back();
    }
});
