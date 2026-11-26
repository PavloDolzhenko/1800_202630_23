// --[ Chat id ]--
export function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

// --[ Avatar letter ]--
export function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : "?";
}

// --[ Empty list message ]--
export function showListMessage(container, text, tag = "li") {
    const line = document.createElement(tag);
    line.className = "list-message";
    line.textContent = text;
    container.replaceChildren(line);
}

// --[ Dates ]--
export function formatDate(timestamp) {
    return timestamp.toDate().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function formatTime(timestamp) {
    return timestamp.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function isToday(timestamp) {
    return timestamp.toDate().toDateString() === new Date().toDateString();
}
