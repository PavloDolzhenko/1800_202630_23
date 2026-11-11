// Pavlo : Ron this is our login section. It handles the Log In and Sign Up forms on login.html.
import { auth, db } from "./firebaseConfig.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getTheme, saveTheme } from "./theme.js";

// Pavlo : Ron this is the page people go to after they log in or sign up right now. Change it here if needed.
const redirectUrl = "activities.html";

// Grab the parts of the page we need
const alertBox = document.getElementById("authAlert");
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");


// Pavlo - shows an error message in the grey box
function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideError() {
    alertBox.classList.add("d-none");
}

// Pavlo - turns Firebase's error codes into simple messages people can understand
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

// Pavlo - switches between the Log In and Sign Up forms
function showView(viewToShow, viewToHide) {
    hideError();
    viewToHide.classList.add("d-none");
    viewToShow.classList.remove("d-none");
    viewToShow.querySelector("input").focus();   // Pavlo - puts the cursor in the first box
}

document.getElementById("toSignup").addEventListener("click", () => showView(signupView, loginView));
document.getElementById("toLogin").addEventListener("click", () => showView(loginView, signupView));


// Pavlo : Ron after someone logs in, this grabs the settings saved on their account (right now just dark mode)
// so the site looks the way they left it, even on a different computer.
async function loadSavedSettings(user) {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const savedTheme = userDoc.data()?.settings?.theme;

        if (savedTheme) {
            saveTheme(savedTheme);
        }
    } catch (error) {
        console.error(error);   // Pavlo - if this fails they're still logged in, it just keeps this browser's theme
    }
}


// Pavlo : Ron this runs when the Log In button is clicked.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();   // Pavlo - stops the page from reloading
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


// Pavlo : Ron this runs when the Create Account button is clicked.
// It makes the account in Firebase Authentication, then saves the person's info
// in the Firestore "users" collection (the collection is created automatically the first time).
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Pavlo - saves their full name on the account so we can say "Hello, Ron Mark!" later
        await updateProfile(user, { displayName: firstName + " " + lastName });

        // Pavlo - saves a document in Firestore: users/<their user id>
        // Pavlo : Ron settings is where Settings page choices get saved. It starts with whatever theme
        // they already had on this browser, so it doesn't suddenly change after they sign up.
        await setDoc(doc(db, "users", user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            settings: {
                theme: getTheme(),
            },
        });

        window.location.href = redirectUrl;
    } catch (error) {
        console.error(error);
        showError(errorMessage(error));
        button.disabled = false;
    }
});
