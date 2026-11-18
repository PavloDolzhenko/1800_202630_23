// Pavlo : Ron this is our chat section. It only runs on chat.html.
// It shows all your friends with the last message from each chat, newest at the top.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getChatId, getInitial, formatDate, formatTime, isToday } from "./chatHelpers.js";

// Grab the parts of the page we need
const chatList = document.getElementById("chatList");
const searchInput = document.getElementById("searchInput");
const rowTemplate = document.getElementById("chatRowTemplate");

let currentUser = null;


// Pavlo - shows one line of text in the list (like "No friends yet")
function showListMessage(text) {
    chatList.innerHTML = "";
    const line = document.createElement("li");
    line.className = "list-message";
    line.textContent = text;
    chatList.appendChild(line);
}


// Pavlo : Ron Firebase takes a second to check if someone is logged in. If nobody is, we send them to login.
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    loadChats();
});

// Pavlo - when you come back to this page with the Back button, the browser can show the old list from memory.
// This reloads it so a chat you just read doesn't still say "New message".
window.addEventListener("pageshow", (event) => {
    if (event.persisted && currentUser) {
        loadChats();
    }
});


// Pavlo : Ron make sure you understand this one, it builds the whole list.
// 1. Get your friends list from your user document
// 2. For each friend, get their username and the chat between you two
// 3. Sort so the newest messages are on top, then show them
async function loadChats() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const friends = userDoc.data()?.friends || [];

        if (friends.length === 0) {
            showListMessage("No friends yet. Press Add Friends to find some!");
            return;
        }

        // Pavlo - Promise.all loads every friend at the same time instead of one by one (much faster)
        const chats = await Promise.all(friends.map(loadOneChat));

        chats.sort((a, b) => lastMessageTime(b) - lastMessageTime(a));

        chatList.innerHTML = "";
        chats.forEach((chat) => chatList.appendChild(makeChatRow(chat)));

        filterChats();   // Pavlo - in case something is already typed in the search box
    } catch (error) {
        console.error(error);
        showListMessage("Couldn't load your chats. Please refresh the page and try again.");
    }
}

// Pavlo - gets one friend's username and your chat with them (chat is null if you haven't talked yet)
async function loadOneChat(friendId) {
    const friendDoc = await getDoc(doc(db, "users", friendId));
    const chatDoc = await getDoc(doc(db, "chats", getChatId(currentUser.uid, friendId)));

    return {
        friendId: friendId,
        username: friendDoc.data()?.username || "Friend",
        chat: chatDoc.data() || null,
    };
}

// Pavlo - when the last message was sent, as a number (0 if there are no messages, so they go to the bottom)
function lastMessageTime(item) {
    return item.chat?.lastMessageAt ? item.chat.lastMessageAt.toMillis() : 0;
}

// Pavlo : Ron this is how we know if there's a new message. The chat document remembers when each person
// last opened it (lastRead). If your friend sent the last message AFTER you last opened it, it's new.
function hasNewMessage(chat) {
    if (!chat || !chat.lastMessageAt || chat.lastSenderId === currentUser.uid) {
        return false;
    }

    const lastRead = chat.lastRead?.[currentUser.uid];
    return !lastRead || chat.lastMessageAt.toMillis() > lastRead.toMillis();
}


// Pavlo - copies the row template and fills it in for one friend
function makeChatRow(item) {
    const row = rowTemplate.content.cloneNode(true);
    const link = row.querySelector(".user-row");
    const statusText = row.querySelector(".status-text");
    const chat = item.chat;

    link.href = "chatting.html?friend=" + item.friendId;
    link.dataset.name = item.username.toLowerCase();   // Pavlo - used by the search box below
    row.querySelector(".avatar").textContent = getInitial(item.username);
    row.querySelector(".user-name").textContent = item.username;

    if (hasNewMessage(chat)) {
        link.classList.add("has-new");
        statusText.textContent = "New message";
    } else if (chat?.lastMessage) {
        const who = chat.lastSenderId === currentUser.uid ? "You: " : "";
        statusText.textContent = who + chat.lastMessage;
    } else {
        statusText.textContent = "No messages yet. Say hi!";
    }

    // Pavlo - shows the time if it was today, or the date if it was before today
    if (chat?.lastMessageAt) {
        const time = chat.lastMessageAt;
        row.querySelector(".chat-date").textContent = isToday(time) ? formatTime(time) : formatDate(time);
    }

    return row;
}


// Pavlo - hides the friends whose name doesn't match what's typed in the search box
function filterChats() {
    const text = searchInput.value.trim().toLowerCase();

    chatList.querySelectorAll(".user-row").forEach((link) => {
        link.parentElement.classList.toggle("d-none", !link.dataset.name.includes(text));
    });
}

searchInput.addEventListener("input", filterChats);
