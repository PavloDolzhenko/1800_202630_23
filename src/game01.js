import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, doc, setDoc, Timestamp, getDocs } from "firebase/firestore";

// Variables used for the game functionality
// Tracks result (win or loss), seconds, score, wrong answer amount, and the game state
let finalResult = "";
let finalSeconds = 0;
let score = 0;
let wrongAnswers = 0;
let gameOver = false;

// Values for the ingame timer, empty until startGame(), as we want timer to only run on purpose
// startTime is the "true" time the game starts, saved in firestore
// elapsedMs shows the time that the user sees, the time that isn't included when activity is not focused
// stretchStart makes sure time is not counted when activity isn't focused
let startTime = null;
let elapsedMs = 0;
let stretchStart = 0;
let timerId = null;
let timerRunning = false;

//Assigning the id's of the intro to the game + whole layout of the playable game
const gameIntro = document.getElementById("gameIntro");
const gameLayout = document.getElementById("game-layout");

// rounds: All the rounds (questions) loaded from Firestore's "activityContent" collection\
// roundsLeft: All the questions not answered yet during the game, questions are removed once user answers so no repeats
let rounds = [];
let roundsLeft = [];

// Current round, and which card (1 or 2) shows the AI content
let currentRound = null;
let aiOption = 1;


// Returns total seconds played not including pauses
// If the timer is running, then take the literal system time right now,
// And subtract it by the system time from when the activity started (stretchStart) to get the time of the current activity
// Then return that plus the time already played before the last pause (elapsedMs) + convert to seconds
// AI was used to find the formula for time
function getElapsedSeconds() {
  let current = 0;
  if (timerRunning) {
    current = Date.now() - stretchStart;
  }

  // Each resume starts measuring from zero again, so we add elapsedMs (time played before the last pause) 
  // to get the full total, then convert to seconds
  return (elapsedMs + current) / 1000;
}

// Puts the elapsed seconds onto the html up to 1 decimal place
function updateTimerDisplay() {
  document.getElementById("timer").textContent = getElapsedSeconds().toFixed(1);
}

// Starts or resumes the clock
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  stretchStart = Date.now();
  timerId = setInterval(updateTimerDisplay, 100);
}

// If the user is off screen or in settings, profile, timer pauses
function pauseTimer() {
  if (timerRunning != true) return;
  elapsedMs = elapsedMs + (Date.now() - stretchStart);
  clearInterval(timerId);
  timerRunning = false;
  updateTimerDisplay();
}

// Reads every document in "activityContent" in firestore and stores each one's fields in rounds
// Using a try catch
async function loadRounds() {
  try {
    const querySnapshot = await getDocs(collection(db, "activityContent")); //reads the collection, waits for firestore to answer

    //add the questions to the rounds array
    querySnapshot.forEach(function (docSnap) {
      rounds.push(docSnap.data());
    });

  } catch (error) {
    console.error("Error loading rounds:", error);
  }
}

// Putting option content on a card (image or as text) depending on the round type
function fillCard(number, content, type) {
  const img = document.getElementById("option" + number + "Img");
  const text = document.getElementById("option" + number + "Text");

  // replacing the card content based on if image or text
  if (type === "image") {
    img.src = content;
    img.classList.remove("d-none");
    text.classList.add("d-none");
  } else {
    text.textContent = content;
    text.classList.remove("d-none");
    img.classList.add("d-none");
  }
}

// Picks a random round, randomly decides which card gets the AI content,
// then fills both cards (images vs images, or text vs text)
function showRound() {

  if (roundsLeft.length === 0) {
    return;
  }

  // Math.random() gives 0 up to 0.99..., so this picks a random position in the array
  const randomIndex = Math.floor(Math.random() * roundsLeft.length);
  currentRound = roundsLeft[randomIndex];

  // Less than 0.5 gives it a 50/50 chance
  if (Math.random() < 0.5) {
    aiOption = 1;
  } else {
    aiOption = 2;
  }

  // Option content is declared based on the random chance
  let option1Content = "";
  let option2Content = "";

  if (aiOption === 1) {
    option1Content = currentRound.aiContent;
    option2Content = currentRound.realContent;
  } else {
    option1Content = currentRound.realContent;
    option2Content = currentRound.aiContent;
  }

  fillCard(1, option1Content, currentRound.type);
  fillCard(2, option2Content, currentRound.type);
}

// Checks which card the user clicked against the card holding the AI content,
// then passes the result to returnAnswer()
function checkChoice(chosenOption) {
  if (chosenOption === aiOption) {
    returnAnswer("correctAnswer");
  } else {
    returnAnswer("wrongAnswer");
  }
}

// Hide the intro, show the game, and only now start the clock
function startGame() {
  gameIntro.classList.add("d-none");
  gameLayout.classList.remove("d-none");

  //List of questions is filled through making a copy through slice
  roundsLeft = rounds.slice();
  showRound(); 

  //Time continues after the round is shown not after!!
  startTime = Timestamp.now();
  elapsedMs = 0;
  startTimer();
}

//when game ends, win or loss is stored, score is saved, timer is saved, final result is shown with final seconds
function endGame(result) { 
  gameOver = true;
  finalResult = result;
  pauseTimer(); // stops the clock and stores the time
  finalSeconds = getElapsedSeconds();
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

  // Say which card was the AI, then show the round's explanation text
  document.getElementById("resultExp").textContent = `Option ${aiOption} was the AI. ${currentRound.explanation}`;

  // Show the explanation through an image
  const expImg = document.getElementById("resultExpImg");
  if (currentRound.explanationImg) {
    expImg.src = currentRound.explanationImg;
    expImg.classList.remove("d-none");
  } else {
    expImg.classList.add("d-none");
  }

  // Hide the questions, and reveal the explanation/results
  document.getElementById("questionScreen").classList.add("d-none");
  document.getElementById("resultScreen").classList.remove("d-none");
}

// Once clicking the next button, the next page shows
// Timer resumes once next page shows
function showQuestion() {
  document.getElementById("resultScreen").classList.add("d-none");
  document.getElementById("questionScreen").classList.remove("d-none");
  startTimer();
  showRound();
}

//The final screen that shows when the game ends
function showFinal() {
  const title = document.getElementById("finalTitle");

  if (finalResult === "WON") {
    title.textContent = "You win!";
  } else {
    title.textContent = "Game over, you lost!";
  }

  //Final stats, score, amount wrong, and final time
  document.getElementById("finalMessage").textContent =
    `Score: ${score} | Wrong: ${wrongAnswers} | Time: ${finalSeconds.toFixed(1)}s`;

  document.getElementById("resultScreen").classList.add("d-none");
  document.getElementById("finalScreen").classList.remove("d-none");
}

// Returning a users answer and accumulating a score, leading to a game over
// A false answer means a deduction in score, correct answer is an increase in score
// If score is 4, user wins, if they get 2 wrong, they lose immediately
// Timer pauses once game is over
const returnAnswer = function (userChoice) {
  if (gameOver) return;
  pauseTimer();

  // Take out the most recent question so it won't come up again
  const position = roundsLeft.indexOf(currentRound);
  if (position != -1) {
    roundsLeft.splice(position, 1);
  }

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

  if (wrongAnswers >= 2) {
    console.log("Game Over!");
    endGame("LOST");
  } else if (score >= 4) {
    console.log("You win!");
    endGame("WON");
  }
  showResult(correct);
};


//Buttons + Event Listeners for the game
//During intro, when user presses button, game starts
document.getElementById("introNextBtn").addEventListener("click", startGame);

document.getElementById("option1Card").addEventListener("click", function () {
  checkChoice(1);
});

document.getElementById("option2Card").addEventListener("click", function () {
  checkChoice(2);
});

//Continue to the next question, but if the game is over, then go to the finished page
document.getElementById("nextBtn").addEventListener("click", function () {
  if (gameOver) {
    showFinal();
  } else {
    showQuestion();
  }
});

// Resumes the timer only if a game is running and the user is on a question
// (not the intro, result, or final screen)
function resumeIfOnQuestion() {
  if (gameOver) return;
  if (startTime === null) return; 

  const questionScreen = document.getElementById("questionScreen");
  if (questionScreen.classList.contains("d-none") != true) {
    startTimer();
  }
}

// Pause the timer when it's not in the window 
window.addEventListener("blur", pauseTimer);
window.addEventListener("focus", resumeIfOnQuestion);

// Pause when the tab is hidden, resume when it's back.
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    pauseTimer();
  } else {
    resumeIfOnQuestion();
  }
});

// Pause when leaving the page (settings, profile, etc.).
window.addEventListener("pagehide", pauseTimer);

// When the page is restored with the back button, resume if the user
// was in the middle of a question. event.persisted means "restored".
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    resumeIfOnQuestion();
  }
});

loadRounds();