// Pavlo : Ron these are small helpers that the chat and add friend pages both use,
// so they live here once instead of being copied into every file.

// Pavlo : Ron make sure you understand this one. Every chat between two people has the same id:
// both user ids sorted and joined with "_". That way both people always open the SAME chat,
// no matter who opens it first, and we never need to search for it.
export function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
}

// Pavlo - the first letter of a username, for the grey square picture (e.g. "ron" -> "R")
export function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : "?";
}

// Pavlo - turns a Firestore date into "11/18/2026" (same style as the wireframe)
export function formatDate(timestamp) {
    return timestamp.toDate().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

// Pavlo - turns a Firestore date into a time like "3:42 PM"
export function formatTime(timestamp) {
    return timestamp.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Pavlo - true if a Firestore date is from today
export function isToday(timestamp) {
    return timestamp.toDate().toDateString() === new Date().toDateString();
}
