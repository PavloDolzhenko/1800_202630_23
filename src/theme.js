// --[ Dark mode ]--
export function getTheme() {
    return localStorage.getItem("theme") || "light";
}

export function applyTheme() {
    document.documentElement.dataset.theme = getTheme();
}

export function saveTheme(theme) {
    localStorage.setItem("theme", theme);
    applyTheme();
}

applyTheme();
window.addEventListener("pageshow", applyTheme);
