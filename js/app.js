import { initAuth, db } from "./firebase.js";
import { initQuiz, state, currentQ, submit, finished }
  from "./quizEngine.js";
import { show, updateQuiz, updateTimerVisual, showFeedback, showSummary } from "./ui.js";
import { addDoc, collection }
  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  await initAuth();

  // ✅ Declare elements FIRST
  const startBtn = document.getElementById("start-btn");
  const submitBtn = document.getElementById("submit");
  const restart = document.getElementById("restart");
  const answer = document.getElementById("answer");
  const final = document.getElementById("final");

  // Input elements
  const divContainer = document.getElementById("div-inputs");
  const ansQ = document.getElementById("ans-q");
  const ansR = document.getElementById("ans-r");

  let timerInterval;
  let TIME_LIMIT = 10; // 10 seconds per question
  let timeLeft = TIME_LIMIT;

  // ✅ THEN attach events
  startBtn.addEventListener("click", () => {
    initQuiz();
    show("quiz-screen");
    loadQ();
  });

  submitBtn.addEventListener("click", () => handle(false)); // Manual submit

  // Allow Enter key on all inputs
  [answer, ansQ, ansR].forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handle(false);
    });
  });

  restart.addEventListener("click", () => {
    location.reload();
  });

  function startTimer() {
    clearInterval(timerInterval);

    // Adaptive Time
    const q = currentQ();
    TIME_LIMIT = (q.type === 'div') ? 15 : 10;

    timeLeft = TIME_LIMIT;
    updateTimerVisual(timeLeft, TIME_LIMIT);

    timerInterval = setInterval(() => {
      timeLeft -= 0.1; // Smooth updates
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handle(true); // Timeout submit
      } else {
        updateTimerVisual(timeLeft, TIME_LIMIT);
      }
    }, 100);
  }

  function loadQ() {
    let q = currentQ();
    updateQuiz(q, state.score, state.idx);
    startTimer();
    answer.focus();
  }

  async function handle(isTimeout) {
    clearInterval(timerInterval);

    let val;
    if (isTimeout) {
      val = "TIMEOUT";
    } else {
      // Check which input is active
      if (!divContainer.classList.contains("hidden")) {
        // Division Mode: Join Q and R
        // Default R to 0 if empty
        const qVal = ansQ.value.trim();
        const rVal = ansR.value.trim() || "0";
        if (qVal === "") return; // Don't submit empty Q (unless timeout)
        val = `${qVal} R ${rVal}`;
      } else {
        val = answer.value;
        if (val === "") return; // Don't submit empty
      }
    }

    const isCorrect = submit(val);

    // Show feedback (visuals)
    showFeedback(isCorrect);

    // Visual delay to let animation play before switching
    await new Promise(r => setTimeout(r, 600));

    answer.value = "";

    if (finished()) {
      await addDoc(collection(db, "sessions"), {
        score: state.score,
        ts: new Date(),
        qs: state.questions
      });

      final.innerText = state.score;
      showSummary(state.questions);
      show("result-screen");
    } else {
      loadQ();
    }
  }

});
