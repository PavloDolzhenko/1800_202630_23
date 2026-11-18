// Pavlo : Ron this is our add friend section. It only runs on add-friend.html.
// You type a username, it searches the "users" collection in Firestore and shows who it finds.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, limit, getDocs, writeBatch, arrayUnion } from "firebase/firestore";
import { getInitial } from "./chatHelpers.js";

// Grab the parts of the page we need
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const rowTemplate = document.getElementById("userRowTemplate");
const noUsernameNote = document.getElementById("noUsernameNote");

let currentUser = null;
let myFriends = [];       // Pavlo - the user ids of everyone you're already friends with
let searchTimer = null;


// Pavlo - shows one line of text in the results box (like "No one found")
function showListMessage(text) {
    results.innerHTML = "";
    const line = document.createElement("li");
    line.className = "list-message";
    line.textContent = text;
    results.appendChild(line);
}


// Pavlo : Ron Firebase takes a second to check if someone is logged in. If nobody is, we send them to login.
// If they are, we load their friends list first so we know who to show the + button for.
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data() || {};

        myFriends = data.friends || [];

        if (!data.username) {
            noUsernameNote.classList.remove("d-none");
        }

        searchInput.disabled = false;
        searchInput.focus();
    } catch (error) {
        console.error(error);
        showListMessage("Couldn't load your friends. Please refresh the page and try again.");
    }
});


// Pavlo - searches while you type, but waits until you stop typing for a moment
// so we don't ask Firestore on every single letter
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchUsers, 300);
});


// Pavlo : Ron make sure you understand this one, it's the actual search.
// Firestore can't do "contains" searches, so this finds usernames that START with what you typed.
// We search usernameLower (the username in small letters) so "ron", "Ron" and "RON" all work.
// "" is just a really high letter, so the range means "starts with this text".
async function searchUsers() {
    const text = searchInput.value.trim().toLowerCase();

    if (text === "") {
        showListMessage("Start searching to find new friends!");
        return;
    }

    try {
        const usersQuery = query(
            collection(db, "users"),
            where("usernameLower", ">=", text),
            where("usernameLower", "<=", text + ""),
            limit(10)
        );
        const snapshot = await getDocs(usersQuery);

        // Pavlo - if they kept typing while we were searching, ignore these old results
        if (searchInput.value.trim().toLowerCase() !== text) {
            return;
        }

        results.innerHTML = "";
        snapshot.forEach((userDoc) => {
            if (userDoc.id !== currentUser.uid) {   // Pavlo - don't show yourself
                results.appendChild(makeUserRow(userDoc.id, userDoc.data().username));
            }
        });

        if (results.children.length === 0) {
            showListMessage("No one found with that username.");
        }
    } catch (error) {
        console.error(error);
        showListMessage("Couldn't search right now. Please try again.");
    }
}


// Pavlo - copies the row template and fills it in for one person
function makeUserRow(userId, username) {
    const row = rowTemplate.content.cloneNode(true);
    const status = row.querySelector(".user-status");
    const button = row.querySelector(".row-btn");

    row.querySelector(".avatar").textContent = getInitial(username);
    row.querySelector(".user-name").textContent = username;

    if (myFriends.includes(userId)) {
        showAsFriend(button, status, userId);
    } else {
        status.textContent = "People you may know...";
        button.querySelector("span").textContent = "person_add";
        button.setAttribute("aria-label", "Add " + username + " as a friend");
        button.onclick = () => addFriend(userId, button, status);
    }

    return row;
}


// Pavlo - once someone is your friend, the + turns into a chat button that opens your chat with them.
// We use button.onclick = instead of addEventListener so the old "add friend" click gets replaced.
function showAsFriend(button, status, userId) {
    status.textContent = "Already friends";
    button.querySelector("span").textContent = "chat";
    button.setAttribute("aria-label", "Open chat");
    button.disabled = false;
    button.onclick = () => {
        window.location.href = "chatting.html?friend=" + userId;
    };
}


// Pavlo : Ron this runs when you press +. It adds them to YOUR friends list and adds you to THEIRS,
// so you show up for each other. arrayUnion is the same thing we used for favourite hikes in class:
// it adds the id to the list without making a copy if it's already there.
// writeBatch saves both changes together, so it can't end up half done (only one person having the friend).
async function addFriend(friendId, button, status) {
    button.disabled = true;   // Pavlo - so it can't be pressed twice while Firebase is working

    try {
        const batch = writeBatch(db);
        batch.set(doc(db, "users", currentUser.uid), { friends: arrayUnion(friendId) }, { merge: true });
        batch.set(doc(db, "users", friendId), { friends: arrayUnion(currentUser.uid) }, { merge: true });
        await batch.commit();

        myFriends.push(friendId);
        showAsFriend(button, status, friendId);
    } catch (error) {
        console.error(error);
        status.textContent = "Couldn't add right now. Try again.";
        button.disabled = false;
    }
}
