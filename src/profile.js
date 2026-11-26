import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { saveTheme } from "./theme.js";
import { getInitial } from "./chatHelpers.js";

const profileForm = document.getElementById("profileForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const avatar = document.getElementById("profileAvatar");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const logoutBtn = document.getElementById("logoutBtn");
const alertBox = document.getElementById("profileAlert");

let currentUser = null;
let savedUsername = "";

// --[ Helpers ]--
function showMessage(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideMessage() {
    alertBox.classList.add("d-none");
}

function setEditing(isEditing) {
    usernameInput.disabled = !isEditing;
    saveBtn.disabled = !isEditing;
    resetBtn.disabled = !isEditing;
}

// --[ Load profile ]--
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    emailInput.value = user.email;

    try {
        const data = (await getDoc(doc(db, "users", user.uid))).data() || {};
        savedUsername = data.username || "";
        usernameInput.value = savedUsername;
        avatar.textContent = getInitial(savedUsername || user.email);
        if (data.settings?.theme) saveTheme(data.settings.theme);
        editBtn.disabled = false;
    } catch (error) {
        console.error(error);
        showMessage("Couldn't load your profile. Please refresh the page and try again.");
    }
});

// --[ Edit and reset ]--
editBtn.addEventListener("click", () => {
    hideMessage();
    setEditing(true);
    usernameInput.focus();
});

resetBtn.addEventListener("click", () => {
    hideMessage();
    usernameInput.value = savedUsername;
    setEditing(false);
});

// --[ Save ]--
profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage();

    const username = usernameInput.value;
    saveBtn.disabled = true;

    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            username: username,
            usernameLower: username.toLowerCase(),
        }, { merge: true });

        savedUsername = username;
        avatar.textContent = getInitial(username);
        setEditing(false);
        showMessage("Profile saved!");
    } catch (error) {
        console.error(error);
        showMessage("Couldn't save your profile. Please try again.");
        saveBtn.disabled = false;
    }
});

// --[ Log out ]--
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
