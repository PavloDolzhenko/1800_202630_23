// Pavlo : Ron dark mode goes first so the colours are right before Bootstrap loads
import './theme.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";

// If you have custom global styles, import them as well:
// import '../styles/style.css';

function sayHello() {

}
// document.addEventListener('DOMContentLoaded', sayHello);


// Pavlo : Ron this takes care of the Back button (top-left) on every page that has one (id="backBtn").
// It used to be copied into settings.js and profile.js, now it lives here once since every page loads main.js.
// If you came from one of our pages it sends you back to that same page. If not (like someone opened
// the page straight from a link) the href on the button is used instead.
const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", (event) => {
        if (document.referrer.startsWith(window.location.origin)) {
            event.preventDefault();   // Pavlo - stops it from going to the href
            history.back();
        }
    });
}

// Ron: If a user is logged in and is on index.html, they get sent to landing.html
// main.js loads on every page, so this only runs on index.html, or users could never leave the other pages
const onIndexPage =
  location.pathname.endsWith("index.html") || location.pathname.endsWith("/");

if (onIndexPage) {
  onAuthStateChanged(auth, function (user) {
    if (user) {
      location.href = "landing.html";
    }
  });
}