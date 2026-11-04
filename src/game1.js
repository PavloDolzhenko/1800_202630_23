import { db, auth } from "./firebaseConfig.js";
import { collection, addDoc, doc, setDoc} from "firebase/firestore";

let score = 0;
let wrongAnswers = 0;
let hasWon = false;
const startTime = Date.now();



// Save score to Firebase
async function saveScore(startTime, endTime, result) {
    try {
        const user = auth.currentUser;

        const scoreData = {
            score: score,
            wrongAnswers: wrongAnswers,
            startTime: startTime,
            endTime: endTime,
            result: result
        };

        if (user) {
            const userScoreRef = doc(db, "scores", user.uid);

            await setDoc(userScoreRef, scoreData);

        } else {
            await addDoc(collection(db, "guestScores"), scoreData);
        }

        console.log("Score saved!");

    } catch (error) {
        console.error("Error saving score:", error);
    }
}

const returnAnswer = function(userChoice) {

    if (userChoice === "wrongAnswer") {
        console.log("Wrong Answer!");
        score -= 1;
        wrongAnswers++;
    }

    if (userChoice === "correctAnswer") {
        console.log("Correct Answer!");
        score += 1;
    }

    if (wrongAnswers >= 3) {
    console.log("Game Over!");
    hasWon = true;

    const endTime = Date.now();
    saveScore(startTime, endTime, "LOST");
}

    console.log("Current score:", score);

    if (score >= 10 && !hasWon) {
        hasWon = true;

        const endTime = Date.now();

        console.log("You win!");
        console.log(`You got ${wrongAnswers} wrong.`);

        saveScore(startTime, endTime, "WON");
    }

};

document.getElementById("option1Card").addEventListener("click", function() {
    returnAnswer("wrongAnswer");
});

document.getElementById("option2Card").addEventListener("click", function() {
    returnAnswer("correctAnswer");
});