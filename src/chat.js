import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getChatId, getInitial, formatDate, formatTime, isToday, showListMessage } from "./chatHelpers.js";

const chatList = document.getElementById("chatList");
const searchInput = document.getElementById("searchInput");
const rowTemplate = document.getElementById("chatRowTemplate");
let currentUser = null;

// --[ Login check ]--
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUser = user;
    loadChats();
});

window.addEventListener("pageshow", (event) => {
    if (event.persisted && currentUser) loadChats();
});

// --[ Load chats ]--
async function loadChats() {
    try {
        const friends = (await getDoc(doc(db, "users", currentUser.uid))).data()?.friends || [];

        if (friends.length === 0) {
            showListMessage(chatList, "No friends yet. Press Add Friends to find some!");
            return;
        }

        const chats = await Promise.all(friends.map(loadOneChat));
        chats.sort((a, b) => lastMessageTime(b) - lastMessageTime(a));
        chatList.replaceChildren(...chats.map(makeChatRow));
        filterChats();
    } catch (error) {
        console.error(error);
        showListMessage(chatList, "Couldn't load your chats. Please refresh the page and try again.");
    }
}

async function loadOneChat(friendId) {
    const friendDoc = await getDoc(doc(db, "users", friendId));
    const chatDoc = await getDoc(doc(db, "chats", getChatId(currentUser.uid, friendId)));

    return {
        friendId: friendId,
        username: friendDoc.data()?.username || "Friend",
        chat: chatDoc.data() || null,
    };
}

function lastMessageTime(item) {
    return item.chat?.lastMessageAt ? item.chat.lastMessageAt.toMillis() : 0;
}

function hasNewMessage(chat) {
    if (!chat || !chat.lastMessageAt || chat.lastSenderId === currentUser.uid) return false;
    const lastRead = chat.lastRead?.[currentUser.uid];
    return !lastRead || chat.lastMessageAt.toMillis() > lastRead.toMillis();
}

// --[ Chat row ]--
function makeChatRow(item) {
    const row = rowTemplate.content.cloneNode(true);
    const link = row.querySelector(".row");
    const statusText = row.querySelector(".status-text");
    const chat = item.chat;

    link.href = "chatting.html?friend=" + item.friendId;
    link.dataset.name = item.username.toLowerCase();
    row.querySelector(".avatar").textContent = getInitial(item.username);
    row.querySelector(".user-name").textContent = item.username;

    if (hasNewMessage(chat)) {
        link.classList.add("has-new");
        statusText.textContent = "New message";
    } else if (chat?.lastMessage) {
        statusText.textContent = (chat.lastSenderId === currentUser.uid ? "You: " : "") + chat.lastMessage;
    } else {
        statusText.textContent = "No messages yet. Say hi!";
    }

    if (chat?.lastMessageAt) {
        const time = chat.lastMessageAt;
        row.querySelector(".chat-date").textContent = isToday(time) ? formatTime(time) : formatDate(time);
    }

    return row;
}

// --[ Search ]--
function filterChats() {
    const text = searchInput.value.trim().toLowerCase();
    chatList.querySelectorAll(".row").forEach((link) => {
        link.parentElement.classList.toggle("d-none", !link.dataset.name.includes(text));
    });
}

searchInput.addEventListener("input", filterChats);
