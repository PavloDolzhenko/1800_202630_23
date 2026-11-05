// Pavlo : Ron this is our settings section. It only runs on settings.html.
import { saveTheme } from "./theme.js";

const darkModeToggle = document.getElementById("darkModeToggle");
const backBtn = document.getElementById("backBtn");


// Pavlo - puts the switch in the right spot when the page opens (ON if dark mode is already on)
darkModeToggle.checked = localStorage.getItem("theme") === "dark";

// Pavlo : Ron make sure you understand this, this is what runs when you flip the Dark Mode switch.
// It saves "dark" or "light" and the colours change straight away, no reload needed.
darkModeToggle.addEventListener("change", () => {
    saveTheme(darkModeToggle.checked ? "dark" : "light");
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
