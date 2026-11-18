// Pavlo : Ron dark mode goes first so the colours are right before Bootstrap loads
import './theme.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

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