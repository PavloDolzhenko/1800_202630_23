// Pavlo : Ron this file is our dark mode. main.js loads it, so it runs on EVERY page
// (new pages too, as long as they load main.js like skeleton.html does).

// Pavlo - this puts the saved theme on the page. It's "light" unless someone turned dark mode on in Settings.
// data-bs-theme is Bootstrap's own dark mode switch, and our CSS files use it too to swap to the dark greys.
export function applyTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
}

// Pavlo - the Settings page calls this when the switch is flipped.
// localStorage remembers it, even after the browser is closed.
export function saveTheme(theme) {
    localStorage.setItem("theme", theme);
    applyTheme();
}

applyTheme();

// Pavlo - when you press the browser's back button, the page can come back from memory
// without running this file again (so it would still be in the old colours). This fixes that.
window.addEventListener("pageshow", applyTheme);
