import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

let score = 0;
let wrongAnswers = 0;
let gameOver = false;
const startTime = Timestamp.now();

// Timer function, 
const timerStart = Date.now();
const timerId = setInterval(function () {
  const seconds = (Date.now() - timerStart) / 1000;
  document.getElementById("timer").textContent = seconds.toFixed(1);
}, 100); //Updates every 100ms, restricted to 1 decimal point
function endGame(result) {
  gameOver = true;
  clearInterval(timerId); // timer stops here once gameOver above is true
  saveScore(startTime, Timestamp.now(), result);
}

// Save score to Firebase
async function saveScore(startTime, endTime, result) {
  try {
    const user = auth.currentUser;

    const scoreData = {
      score: score,
      wrongAnswers: wrongAnswers,
      startTime: startTime,
      endTime: endTime,
      result: result,
    };

    if (user) {
      const userScoreRef = doc(db, "scores", user.uid);

      await setDoc(userScoreRef, scoreData);
    } else {
      await addDoc(collection(db, "guestScores"), scoreData); // If user's aren't logged in, scores are saved in a "guestScores" collection
    }

    console.log("Score saved!");
  } catch (error) {
    console.error("Error saving score:", error);
  }
}

const returnAnswer = function (userChoice) {
  if (gameOver) return;

  if (userChoice === "wrongAnswer") {
    console.log("Wrong Answer!");
    score -= 1;
    wrongAnswers++;
  }

  if (userChoice === "correctAnswer") {
    console.log("Correct Answer!");
    score += 1;
  }

  console.log("Current score:", score);

  if (wrongAnswers >= 3) {
    console.log("Game Over!");
    endGame("LOST");
  } else if (score >= 10) {
    console.log("You win!");
    endGame("WON");
  }
};

document.getElementById("option1Card").addEventListener("click", function () {
  returnAnswer("wrongAnswer");
});

document.getElementById("option2Card").addEventListener("click", function () {
  returnAnswer("correctAnswer");
});
