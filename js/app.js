import { initAuth, db, loginGoogle, logout, currentUser, auth } from "./firebase.js";
import { initQuiz, state, currentQ, submit, finished, startQuestionTimer } from "./quizEngine.js";
import { show, updateQuiz, updateTimerVisual, showFeedback, showSummary } from "./ui.js";
import { logEvent } from "./logger.js";
import { playCorrect, playWrong, playTick } from "./audio.js";
import { storageManager } from "./storage_manager.js";

document.addEventListener("DOMContentLoaded", async () => {

  // Auth Status Listener
  await initAuth((user) => {
    const userDisplay = document.getElementById("user-display");
    const authBtn = document.getElementById("auth-btn");

    if (user && !user.isAnonymous) {
      userDisplay.innerText = user.displayName || "User";
      authBtn.innerText = "Logout";
      authBtn.onclick = logout;
    } else {
      userDisplay.innerText = "Guest";
      authBtn.innerText = "Login";
      authBtn.onclick = loginGoogle;
    }
  });

  // Elements
  const answer = document.getElementById("answer");
  const final = document.getElementById("final");

  // Input elements
  const divContainer = document.getElementById("div-inputs");
  const ansQ = document.getElementById("ans-q");
  const ansR = document.getElementById("ans-r");

  let timerInterval;
  let TIME_LIMIT = 10;
  let timeLeft = TIME_LIMIT;
  let currentMode = 'standard';

  // Navigation Events
  document.getElementById("btn-std").onclick = () => startQuiz('standard', 20);
  document.getElementById("btn-trader-20").onclick = () => startQuiz('trader', 20);
  document.getElementById("btn-trader-40").onclick = () => startQuiz('trader', 40);
  document.getElementById("btn-memory").onclick = () => startQuiz('memory', 20);
  document.getElementById("btn-dash").onclick = loadDashboard;
  document.getElementById("dash-back").onclick = () => show('start-screen');

  document.getElementById("submit").addEventListener("click", () => handle(false));
  document.getElementById("restart").addEventListener("click", () => show('start-screen'));

  // Allow Enter key
  [answer, ansQ, ansR].forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      logEvent("INPUT_KEY", { key: e.key, id: inp.id });
      if (e.key === "Enter") handle(false);
    });
  });

  function startQuiz(mode, count) {
    currentMode = mode;
    initQuiz(mode, count); // Pass count here
    show("quiz-screen");
    loadQ();
    playCorrect();
  }

  function startTimer() {
    clearInterval(timerInterval);

    const q = currentQ();

    // Time Logic based on Mode/Type
    if (currentMode === 'trader') {
      TIME_LIMIT = 5; // Fast!
    } else if (currentMode === 'memory') {
      TIME_LIMIT = 15; // More time to think
    } else {
      // Standard adaptive
      if (q.type === 'div' || q.type === 'double') TIME_LIMIT = 15;
      else TIME_LIMIT = 10;
    }

    logEvent("TIMER_START", { limit: TIME_LIMIT, type: q.type });

    timeLeft = TIME_LIMIT;
    updateTimerVisual(timeLeft, TIME_LIMIT);
    startQuestionTimer();

    timerInterval = setInterval(() => {
      timeLeft -= 0.1;

      if (timeLeft <= 3.0 && timeLeft > 0 && Math.floor(timeLeft * 10) % 10 === 0) {
        playTick();
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handle(true);
      } else {
        updateTimerVisual(timeLeft, TIME_LIMIT);
      }
    }, 100);
  }

  function loadQ() {
    let q = currentQ();
    updateQuiz(q, state.score, state.idx, state.streak);
    startTimer();
    answer.focus();
  }

  async function handle(isTimeout) {
    clearInterval(timerInterval);

    let val;
    if (isTimeout) {
      val = "TIMEOUT";
    } else {
      if (!divContainer.classList.contains("hidden")) {
        const qVal = ansQ.value.trim();
        const rVal = ansR.value.trim() || "0";
        if (qVal === "") return;
        val = `${qVal} R ${rVal}`;
      } else {
        val = answer.value;
        if (val === "") return;
      }
    }

    const isCorrect = submit(val);

    if (isCorrect) playCorrect();
    else playWrong();

    showFeedback(isCorrect);
    await new Promise(r => setTimeout(r, 600));

    answer.value = "";

    if (finished()) {
      // Save Session using Storage Manager (Hybrid)
      const sessionData = {
        score: state.score,
        mode: currentMode,
        ts: new Date(),
        uid: currentUser ? currentUser.uid : 'anon',
        maxStreak: state.maxStreak
      };

      await storageManager.saveSession(sessionData, currentUser);

      final.innerText = `${state.score} / ${state.questions.length}`; // Show correct total
      showSummary(state.questions);
      show("result-screen");
    } else {
      loadQ();
    }
  }

  // Phase 4: Dashboard Logic
  async function loadDashboard() {
    show('dashboard-screen');

    const history = await storageManager.getHistory(currentUser);
    const historyBody = document.getElementById("dash-history");
    historyBody.innerHTML = "";

    let totalGames = 0;
    let highScore = 0;

    history.forEach(data => {
      totalGames++;
      if (data.score > highScore) highScore = data.score;

      const date = storageManager.parseDate(data.ts).toLocaleDateString();
      const row = `
            <tr class="border-b border-slate-700">
                <td class="px-3 py-2 text-white font-medium capitalize">
                    ${data.mode || 'standard'}
                </td>
                <td class="px-3 py-2 text-right text-cyan-400 font-mono text-lg">
                    ${data.score}
                </td>
                <td class="px-3 py-2 text-right text-slate-500 text-xs">
                    ${date}
                </td>
            </tr>
        `;
      historyBody.innerHTML += row;
    });

    document.getElementById("stat-games").innerText = totalGames;
    document.getElementById("stat-high").innerText = highScore;
  }

});
