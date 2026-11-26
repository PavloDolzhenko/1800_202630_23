import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getChatId, getInitial, formatDate, formatTime, showListMessage } from "./chatHelpers.js";

const messagesBox = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const alertBox = document.getElementById("chatAlert");
const friendId = new URLSearchParams(window.location.search).get("friend");

let currentUser = null;
let chatId = null;

const showBoxMessage = (text) => showListMessage(messagesBox, text, "p");

// --[ Open the chat ]--
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    if (!friendId) {
        showBoxMessage("Couldn't find this chat. Go back and pick a friend.");
        return;
    }

    try {
        const myFriends = (await getDoc(doc(db, "users", user.uid))).data()?.friends || [];
        if (!myFriends.includes(friendId)) {
            showBoxMessage("You can only chat with your friends. Add them on the Add Friend page first.");
            return;
        }

        const friendName = (await getDoc(doc(db, "users", friendId))).data()?.username || "Friend";
        document.getElementById("friendName").textContent = friendName;
        document.getElementById("friendAvatar").textContent = getInitial(friendName);

        chatId = getChatId(user.uid, friendId);
        listenForMessages();

        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    } catch (error) {
        console.error(error);
        showBoxMessage("Couldn't load this chat. Please refresh the page and try again.");
    }
});

// --[ Live messages ]--
function listenForMessages() {
    const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("sentAt"));

    onSnapshot(messagesQuery, (snapshot) => {
        showMessages(snapshot);
        if (!snapshot.empty) markAsRead();
    }, (error) => {
        console.error(error);
        showBoxMessage("Lost connection to the chat. Please refresh the page.");
    });
}

function showMessages(snapshot) {
    if (snapshot.empty) {
        showBoxMessage("No messages yet. Say hi!");
        return;
    }

    messagesBox.innerHTML = "";
    let lastDate = "";

    snapshot.forEach((messageDoc) => {
        const message = messageDoc.data({ serverTimestamps: "estimate" });
        const date = formatDate(message.sentAt);

        if (date !== lastDate) {
            const dateLine = document.createElement("p");
            dateLine.className = "date-divider";
            dateLine.textContent = date;
            messagesBox.appendChild(dateLine);
            lastDate = date;
        }

        messagesBox.appendChild(makeBubble(message));
    });

    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function makeBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = message.senderId === currentUser.uid ? "message mine" : "message";

    const text = document.createElement("p");
    text.textContent = message.text;

    const time = document.createElement("small");
    time.textContent = formatTime(message.sentAt);

    bubble.append(text, time);
    return bubble;
}

function markAsRead() {
    setDoc(doc(db, "chats", chatId), {
        lastRead: { [currentUser.uid]: serverTimestamp() },
    }, { merge: true }).catch((error) => console.error(error));
}

// --[ Send a message ]--
messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();
    if (text === "") return;

    messageInput.value = "";
    alertBox.classList.add("d-none");

    try {
        await addDoc(collection(db, "chats", chatId, "messages"), {
            text: text,
            senderId: currentUser.uid,
            sentAt: serverTimestamp(),
        });

        await setDoc(doc(db, "chats", chatId), {
            members: [currentUser.uid, friendId].sort(),
            lastMessage: text,
            lastSenderId: currentUser.uid,
            lastMessageAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error(error);
        messageInput.value = text;
        alertBox.textContent = "Couldn't send your message. Please try again.";
        alertBox.classList.remove("d-none");
    }
});
