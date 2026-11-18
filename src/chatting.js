// Pavlo : Ron this is the chatting section. It only runs on chatting.html.
// It shows the messages between you and one friend, updates live, and sends new messages.
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getChatId, getInitial, formatDate, formatTime } from "./chatHelpers.js";

// Grab the parts of the page we need
const messagesBox = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const alertBox = document.getElementById("chatAlert");

// Pavlo - the friend's user id comes from the link, e.g. chatting.html?friend=abc123
const friendId = new URLSearchParams(window.location.search).get("friend");

let currentUser = null;
let chatId = null;


// Pavlo - shows a message in the grey box (same as the login page)
function showAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

// Pavlo - puts one line of text in the middle of the messages box (like "No messages yet")
function showBoxMessage(text) {
    messagesBox.innerHTML = "";
    const line = document.createElement("p");
    line.className = "list-message";
    line.textContent = text;
    messagesBox.appendChild(line);
}


// Pavlo : Ron Firebase takes a second to check if someone is logged in. If nobody is, we send them to login.
// Then we check this person is actually your friend before showing anything.
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const myFriends = userDoc.data()?.friends || [];

        if (!myFriends.includes(friendId)) {
            showBoxMessage("You can only chat with your friends. Add them on the Add Friend page first.");
            return;
        }

        const friendDoc = await getDoc(doc(db, "users", friendId));
        const friendName = friendDoc.data()?.username || "Friend";
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


// Pavlo : Ron make sure you understand this one, it's what makes the chat live.
// onSnapshot is like getDocs, but it KEEPS listening. Every time a message is added (by you or your friend)
// Firebase runs this again with the updated list, so new messages show up without refreshing.
function listenForMessages() {
    const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("sentAt"));

    onSnapshot(messagesQuery, (snapshot) => {
        showMessages(snapshot);

        if (!snapshot.empty) {
            markAsRead();
        }
    }, (error) => {
        console.error(error);
        showBoxMessage("Lost connection to the chat. Please refresh the page.");
    });
}


// Pavlo - draws all the messages. Yours go on the right, your friend's on the left,
// and a date line goes in between whenever the day changes.
function showMessages(snapshot) {
    if (snapshot.empty) {
        showBoxMessage("No messages yet. Say hi!");
        return;
    }

    messagesBox.innerHTML = "";
    let lastDate = "";

    snapshot.forEach((messageDoc) => {
        // Pavlo - "estimate" gives a time to messages that are still being sent, so they don't show up blank
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

    messagesBox.scrollTop = messagesBox.scrollHeight;   // Pavlo - jumps down to the newest message
}

// Pavlo - makes one chat bubble. We use textContent (not innerHTML) so nobody can sneak code into a message.
function makeBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = message.senderId === currentUser.uid ? "message mine" : "message theirs";

    const text = document.createElement("p");
    text.textContent = message.text;

    const time = document.createElement("small");
    time.textContent = formatTime(message.sentAt);

    bubble.append(text, time);
    return bubble;
}


// Pavlo - saves the time you last looked at this chat, so the chat list knows the messages aren't new anymore.
// [currentUser.uid] uses your user id as the name, e.g. lastRead: { abc123: <time> }
function markAsRead() {
    setDoc(doc(db, "chats", chatId), {
        lastRead: { [currentUser.uid]: serverTimestamp() },
    }, { merge: true }).catch((error) => console.error(error));
}


// Pavlo : Ron this runs when you press Send (or Enter).
// 1. Adds the message to chats/<chat id>/messages
// 2. Updates the chat document with the last message, so the chat list can show it
messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();   // Pavlo - stops the page from reloading

    const text = messageInput.value.trim();
    if (text === "") {
        return;
    }

    messageInput.value = "";   // Pavlo - clears the box straight away so it feels quick
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
        messageInput.value = text;   // Pavlo - puts their message back so they don't lose it
        showAlert("Couldn't send your message. Please try again.");
    }
});
