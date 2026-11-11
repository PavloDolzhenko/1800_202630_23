// Pavlo : Ron this file is our dark mode. main.js loads it, so it runs on EVERY page
// (new pages too, as long as they load main.js like skeleton.html does).

// Pavlo - gives back "dark" or "light". It's "light" unless someone turned dark mode on in Settings.
export function getTheme() {
    return localStorage.getItem("theme") || "light";
}

// Pavlo - this puts the saved theme on the page.
// data-bs-theme is Bootstrap's own dark mode switch, and our CSS files use it too to swap to the dark greys.
export function applyTheme() {
    document.documentElement.setAttribute("data-bs-theme", getTheme());
}

// Pavlo - Settings calls this when the switch is flipped, and login / profile call it when they load
// the theme saved on someone's account. localStorage remembers it, even after the browser is closed.
// (Saving it to Firestore happens in settings.js, this file doesn't use Firebase so every page stays fast.)
export function saveTheme(theme) {
    localStorage.setItem("theme", theme);
    applyTheme();
}

applyTheme();

// Pavlo - when you press the browser's back button, the page can come back from memory
// without running this file again (so it would still be in the old colours). This fixes that.
window.addEventListener("pageshow", applyTheme);
