import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

let finalResult = "";
let finalSeconds = 0;
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

//when game ends, win or loss is stored, score is saved, timer is saved, final result is shown with final seconds
function endGame(result) { 
  gameOver = true;
  finalResult = result;
  finalSeconds = (Date.now() - timerStart) / 1000;
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

// Creating a right/wrong screen, displays after clicking a card
function showResult(correct) {
  const title = document.getElementById("resultTitle");
  const message = document.getElementById("resultMessage");

  if (correct) {
    title.textContent = "Correct!";
  } else {
    title.textContent = "Wrong!";
  }

  message.textContent = `Score: ${score} | Wrong: ${wrongAnswers}`;

  document.getElementById("questionScreen").classList.add("d-none");
  document.getElementById("resultScreen").classList.remove("d-none");
}

// Once clicking the next button, the next page shows
function showQuestion() {
  document.getElementById("resultScreen").classList.add("d-none");
  document.getElementById("questionScreen").classList.remove("d-none");
}

//The final screen that shows when the game ends
function showFinal() {
  const title = document.getElementById("finalTitle");

  if (finalResult === "WON") {
    title.textContent = "You win!";
  } else {
    title.textContent = "Game over, you lost!";
  }

  document.getElementById("finalMessage").textContent =
    `Score: ${score} | Wrong: ${wrongAnswers} | Time: ${finalSeconds.toFixed(1)}s`;

  document.getElementById("resultScreen").classList.add("d-none");
  document.getElementById("finalScreen").classList.remove("d-none");
}

//Returning a users answer and accumulating a score, leading to a game over
const returnAnswer = function (userChoice) {
  if (gameOver) return;

  let correct = false;

  if (userChoice === "wrongAnswer") {
    console.log("Wrong Answer!");
    score -= 1;
    wrongAnswers++;
  }

  if (userChoice === "correctAnswer") {
    console.log("Correct Answer!");
    score += 1;
    correct = true;
  }

  // score can't be below 0
  if (score <= -1) {
    score = 0;
  }

  console.log("Current score:", score);

  if (wrongAnswers >= 3) {
    console.log("Game Over!");
    endGame("LOST");
  } else if (score >= 10) {
    console.log("You win!");
    endGame("WON");
  }
  showResult(correct);
};

document.getElementById("option1Card").addEventListener("click", function () {
  returnAnswer("wrongAnswer");
});

document.getElementById("option2Card").addEventListener("click", function () {
  returnAnswer("correctAnswer");
});

document.getElementById("nextBtn").addEventListener("click", function () {
  if (gameOver) {
    showFinal();
  } else {
    showQuestion();
  }
});