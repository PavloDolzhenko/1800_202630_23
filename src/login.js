import { auth, db } from "./firebaseConfig.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme, saveTheme } from "./theme.js";

const redirectUrl = "landing.html";
const alertBox = document.getElementById("authAlert");
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

// --[ Messages ]--
function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideError() {
    alertBox.classList.add("d-none");
}

function errorMessage(error) {
    const messages = {
        "auth/invalid-credential": "Wrong email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
        "auth/network-request-failed": "No internet connection. Please try again.",
    };
    return messages[error.code] || "Something went wrong. Please try again.";
}

// --[ Switch between log in and sign up ]--
function showView(viewToShow, viewToHide) {
    hideError();
    viewToHide.classList.add("d-none");
    viewToShow.classList.remove("d-none");
    viewToShow.querySelector("input").focus();
}

document.getElementById("toSignup").addEventListener("click", () => showView(signupView, loginView));
document.getElementById("toLogin").addEventListener("click", () => showView(loginView, signupView));

// --[ Saved settings ]--
async function loadSavedSettings(user) {
    try {
        const savedTheme = (await getDoc(doc(db, "users", user.uid))).data()?.settings?.theme;
        if (savedTheme) saveTheme(savedTheme);
    } catch (error) {
        console.error(error);
    }
}

// --[ Log in ]--
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const button = loginForm.querySelector("button");

    button.disabled = true;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await loadSavedSettings(userCredential.user);
        window.location.href = redirectUrl;
    } catch (error) {
        console.error(error);
        showError(errorMessage(error));
        button.disabled = false;
    }
});

// --[ Sign up ]--
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const firstName = document.getElementById("signupFirstName").value.trim();
    const lastName = document.getElementById("signupLastName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const button = signupForm.querySelector("button");

    button.disabled = true;
    try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: firstName + " " + lastName });
        await setDoc(doc(db, "users", user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            settings: { theme: getTheme() },
        });
        window.location.href = redirectUrl;
    } catch (error) {
        console.error(error);
        showError(errorMessage(error));
        button.disabled = false;
    }
});
