import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

onAuthStateChanged(auth, async function (user) {
  if (!user) {
    location.href = "index.html";
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.data() || {};   // {} if they don't have a document yet

  // use the first one that exists: username, then first name, then email
  const name = data.username || data.firstName || user.email;
  document.getElementById("userName").textContent = name;
});