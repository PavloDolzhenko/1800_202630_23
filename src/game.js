import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, doc, setDoc, getDocs, Timestamp } from "firebase/firestore";

// --[ Modes ]--
const MODES = {
    classic: { title: "Classic", question: "Which one is AI?", scores: "scores", guestScores: "guestScores" },
    practice: { title: "Practice", question: "Which one is AI? Take your time.", endless: true, finish: true },
    timed: { title: "Timed", question: "Which one is AI? You have 30 seconds!", endless: true, timeLimit: 30, scores: "timedScores", guestScores: "guestTimedScores" },
};
const mode = MODES[new URLSearchParams(location.search).get("mode")] || MODES.classic;

const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("d-none");
const hide = (id) => $(id).classList.add("d-none");

// --[ State ]--
let rounds = [];
let roundsLeft = [];
let currentRound = null;
let aiOption = 1;
let score = 0;
let wrongAnswers = 0;
let gameOver = false;
let finalResult = "";
let finalSeconds = 0;

let startTime = null;
let elapsedMs = 0;
let stretchStart = 0;
let timerId = null;
let timerRunning = false;

// --[ Timer ]--
function getElapsedSeconds() {
    const current = timerRunning ? Date.now() - stretchStart : 0;
    return (elapsedMs + current) / 1000;
}

function updateTimerDisplay() {
    if (!mode.timeLimit) {
        $("timer").textContent = getElapsedSeconds().toFixed(1);
        return;
    }

    const remaining = Math.max(0, mode.timeLimit - getElapsedSeconds());
    $("timer").textContent = remaining.toFixed(1);

    if (remaining <= 0 && !gameOver) {
        endGame("TIME UP");
        hide("questionScreen");
        showFinal();
    }
}

function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    stretchStart = Date.now();
    timerId = setInterval(updateTimerDisplay, 100);
}

function pauseTimer() {
    if (!timerRunning) return;
    elapsedMs += Date.now() - stretchStart;
    clearInterval(timerId);
    timerRunning = false;
    updateTimerDisplay();
}

// --[ Rounds ]--
async function loadRounds() {
    try {
        const snapshot = await getDocs(collection(db, "activityContent"));
        snapshot.forEach((docSnap) => rounds.push(docSnap.data()));
        if (rounds.length === 0) throw new Error("No rounds found");

        $("introNextBtn").disabled = false;
        $("introNextBtn").textContent = "Start";
    } catch (error) {
        console.error("Error loading rounds:", error);
        $("introNextBtn").textContent = "Couldn't load, please refresh";
    }
}

function fillCard(number, content, type) {
    const img = $("option" + number + "Img");
    const text = $("option" + number + "Text");

    img.classList.toggle("d-none", type !== "image");
    text.classList.toggle("d-none", type === "image");

    if (type === "image") img.src = content;
    else text.textContent = content;
}

function showRound() {
    if (roundsLeft.length === 0) {
        if (!mode.endless) return;
        roundsLeft = rounds.slice();
    }

    currentRound = roundsLeft[Math.floor(Math.random() * roundsLeft.length)];
    aiOption = Math.random() < 0.5 ? 1 : 2;

    fillCard(1, aiOption === 1 ? currentRound.aiContent : currentRound.realContent, currentRound.type);
    fillCard(2, aiOption === 2 ? currentRound.aiContent : currentRound.realContent, currentRound.type);
}

// --[ Playing ]--
function startGame() {
    hide("gameIntro");
    show("gameLayout");
    roundsLeft = rounds.slice();
    showRound();

    startTime = Timestamp.now();
    elapsedMs = 0;
    startTimer();
}

function answer(chosenOption) {
    if (gameOver) return;
    pauseTimer();

    const position = roundsLeft.indexOf(currentRound);
    if (position !== -1) roundsLeft.splice(position, 1);

    const correct = chosenOption === aiOption;
    if (correct) {
        score++;
    } else {
        score = Math.max(0, score - 1);
        wrongAnswers++;
    }

    if (!mode.endless && wrongAnswers >= 2) endGame("LOST");
    else if (!mode.endless && score >= 4) endGame("WON");

    showResult(correct);
}

function endGame(result) {
    gameOver = true;
    finalResult = result;
    pauseTimer();
    finalSeconds = getElapsedSeconds();
    if (mode.scores) saveScore(result);
}

async function saveScore(result) {
    const scoreData = { score, wrongAnswers, startTime, endTime: Timestamp.now(), result };

    try {
        const user = auth.currentUser;
        if (user) await setDoc(doc(db, mode.scores, user.uid), scoreData);
        else await addDoc(collection(db, mode.guestScores), scoreData);
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// --[ Screens ]--
function showResult(correct) {
    $("resultScreen").dataset.correct = correct;
    $("resultIcon").textContent = correct ? "check_circle" : "cancel";
    $("resultTitle").textContent = correct ? "Correct!" : "Wrong!";
    $("resultExp").textContent = `Option ${aiOption} was the AI. ${currentRound.explanation}`;
    $("resultMessage").textContent = `Score: ${score} | Wrong: ${wrongAnswers}`;

    const expImg = $("resultExpImg");
    expImg.classList.toggle("d-none", !currentRound.explanationImg);
    if (currentRound.explanationImg) expImg.src = currentRound.explanationImg;

    hide("questionScreen");
    show("resultScreen");
}

function showQuestion() {
    hide("resultScreen");
    show("questionScreen");
    startTimer();
    showRound();
}

function showFinal() {
    const endings = {
        WON: ["You win!", "emoji_events"],
        LOST: ["Game over, you lost!", "sentiment_dissatisfied"],
        PRACTICE: ["Nice practice!", "fitness_center"],
        "TIME UP": ["Time's up!", "timer_off"],
    };
    const [title, icon] = endings[finalResult];
    const time = mode.timeLimit ? "" : ` | Time: ${finalSeconds.toFixed(1)}s`;

    $("finalIcon").textContent = icon;
    $("finalTitle").textContent = title;
    $("finalMessage").textContent = `Score: ${score} | Wrong: ${wrongAnswers}${time}`;

    hide("resultScreen");
    hide("finishBtn");
    show("finalScreen");
}

// --[ Buttons ]--
$("introNextBtn").addEventListener("click", startGame);
$("option1Card").addEventListener("click", () => answer(1));
$("option2Card").addEventListener("click", () => answer(2));
$("nextBtn").addEventListener("click", () => (gameOver ? showFinal() : showQuestion()));

$("finishBtn").addEventListener("click", () => {
    if (gameOver) return;
    endGame("PRACTICE");
    hide("questionScreen");
    showFinal();
});

// --[ Pause when away ]--
function resumeIfOnQuestion() {
    if (!gameOver && startTime && !$("questionScreen").classList.contains("d-none")) startTimer();
}

window.addEventListener("blur", pauseTimer);
window.addEventListener("focus", resumeIfOnQuestion);
window.addEventListener("pagehide", pauseTimer);
window.addEventListener("pageshow", (event) => event.persisted && resumeIfOnQuestion());
document.addEventListener("visibilitychange", () => (document.hidden ? pauseTimer() : resumeIfOnQuestion()));

// --[ Start ]--
$("gameTitle").textContent = mode.title;
$("gameQuestion").textContent = mode.question;
$("finishBtn").classList.toggle("d-none", !mode.finish);
updateTimerDisplay();
loadRounds();
