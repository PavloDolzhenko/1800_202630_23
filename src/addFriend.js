import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, limit, getDocs, writeBatch, arrayUnion } from "firebase/firestore";
import { getInitial, showListMessage } from "./chatHelpers.js";

const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const rowTemplate = document.getElementById("userRowTemplate");

let currentUser = null;
let myFriends = [];
let searchTimer = null;

// --[ Login check ]--
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    try {
        const data = (await getDoc(doc(db, "users", user.uid))).data() || {};
        myFriends = data.friends || [];
        document.getElementById("noUsernameNote").classList.toggle("d-none", !!data.username);
        searchInput.disabled = false;
        searchInput.focus();
    } catch (error) {
        console.error(error);
        showListMessage(results, "Couldn't load your friends. Please refresh the page and try again.");
    }
});

// --[ Search ]--
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchUsers, 300);
});

async function searchUsers() {
    const text = searchInput.value.trim().toLowerCase();

    if (text === "") {
        showListMessage(results, "Start searching to find new friends!");
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

        if (searchInput.value.trim().toLowerCase() !== text) return;

        const rows = snapshot.docs
            .filter((userDoc) => userDoc.id !== currentUser.uid)
            .map((userDoc) => makeUserRow(userDoc.id, userDoc.data().username));

        if (rows.length === 0) showListMessage(results, "No one found with that username.");
        else results.replaceChildren(...rows);
    } catch (error) {
        console.error(error);
        showListMessage(results, "Couldn't search right now. Please try again.");
    }
}

// --[ Result row ]--
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
        button.querySelector(".icon").textContent = "person_add";
        button.setAttribute("aria-label", "Add " + username + " as a friend");
        button.onclick = () => addFriend(userId, button, status);
    }

    return row;
}

function showAsFriend(button, status, userId) {
    status.textContent = "Already friends";
    button.querySelector(".icon").textContent = "chat";
    button.setAttribute("aria-label", "Open chat");
    button.disabled = false;
    button.onclick = () => (window.location.href = "chatting.html?friend=" + userId);
}

// --[ Add friend ]--
async function addFriend(friendId, button, status) {
    button.disabled = true;

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
