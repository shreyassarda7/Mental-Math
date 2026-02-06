// DOM Elements (Cached)
import { state } from "./quizEngine.js";

const question = document.getElementById("question");
const scoreEl = document.getElementById("score");
const qnum = document.getElementById("qnum");
const progressBar = document.getElementById("progress-bar");
const timerBar = document.getElementById("timer-bar");
const timeText = document.getElementById("time");
const quizCard = document.getElementById("quiz-card");

// Input Elements
const regularInput = document.getElementById("answer");
const divContainer = document.getElementById("div-inputs");
const ansQ = document.getElementById("ans-q");
const ansR = document.getElementById("ans-r");

// Summary
const summaryBody = document.getElementById("summary-body");

export function show(id) {
  // Hide all main containers
  ['start-screen', 'quiz-screen', 'result-screen'].forEach(sid => {
    document.getElementById(sid).classList.add("hidden");
  });
  // Show the requested one
  document.getElementById(id).classList.remove("hidden");
}

export function updateQuiz(q, score, idx, streak) {
  question.innerText = q.text;

  // Show score + streak
  const streakText = streak > 1 ? ` 🔥 ${streak}` : '';
  scoreEl.innerHTML = `${score} <span class="text-orange-500 text-lg animate-pulse">${streakText}</span>`;

  qnum.innerText = idx + 1;

  // Progress
  const pct = (idx / 20) * 100;
  progressBar.style.width = `${pct}%`;

  // Toggle Input Type
  if (q.type === 'div') {
    regularInput.classList.add("hidden");
    divContainer.classList.remove("hidden");
    ansQ.value = '';
    ansR.value = '';
    ansQ.focus();
  } else {
    regularInput.classList.remove("hidden");
    divContainer.classList.add("hidden");
    regularInput.value = '';
    regularInput.focus();
  }
}

export function updateTimerVisual(timeLeft, maxTime) {
  const pct = (timeLeft / maxTime) * 100;
  timerBar.style.width = `${pct}%`;

  // Color change based on urgency
  if (pct < 30) {
    timerBar.className = "absolute top-0 left-0 h-1 transition-all duration-100 ease-linear bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]";
    timeText.className = "text-2xl text-red-500 animate-pulse";
  } else if (pct < 60) {
    timerBar.className = "absolute top-0 left-0 h-1 transition-all duration-100 ease-linear bg-yellow-400";
    timeText.className = "text-2xl text-yellow-400";
  } else {
    timerBar.className = "absolute top-0 left-0 h-1 transition-all duration-100 ease-linear bg-emerald-400";
    timeText.className = "text-2xl text-white";
  }

  // Text update
  if (timeText) timeText.innerText = Math.ceil(timeLeft);
}

export function showFeedback(isCorrect) {
  // Remove old classes to trigger reflow if needed (simple approach)
  quizCard.classList.remove("animate-shake", "flash-correct", "flash-wrong");
  void quizCard.offsetWidth;

  if (isCorrect) {
    quizCard.classList.add("flash-correct");
  } else {
    quizCard.classList.add("flash-wrong", "animate-shake");
  }

  setTimeout(() => {
    quizCard.classList.remove("animate-shake", "flash-correct", "flash-wrong");
  }, 500);
}

export function showSummary(questions) {
  // Clear previous
  summaryBody.innerHTML = "";

  let totalTime = 0;

  questions.forEach((q, i) => {
    totalTime += (q.timeTaken || 0);
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors";

    // Status Icon
    const success = q.correct
      ? '<span class="text-green-400 font-bold">✓</span>'
      : '<span class="text-red-500 font-bold">✗</span>';

    // Highlight row if wrong
    if (!q.correct) tr.classList.add("bg-red-900/10");

    // Format Time
    const timeStr = q.timeTaken ? `${q.timeTaken.toFixed(1)}s` : "-";

    tr.innerHTML = `
      <th scope="row" class="px-4 py-3 font-medium text-white whitespace-nowrap">
        ${i + 1}. ${q.text}
      </th>
      <td class="px-4 py-3 text-slate-300">
        ${q.userAnswer === 'TIMEOUT' ? '<span class="text-orange-400">Time</span>' : q.userAnswer}
      </td>
      <td class="px-4 py-3 text-cyan-400 font-mono">
        ${q.answer}
      </td>
      <td class="px-4 py-3 text-slate-400 text-xs text-right">
        ${timeStr}
      </td>
      <td class="px-4 py-3 text-center">
        ${success}
      </td>
    `;
    summaryBody.appendChild(tr);
  });

  const avgTime = (totalTime / questions.length).toFixed(1);
  const avgRow = document.createElement("tr");
  // Fix: whitespace-nowrap might cause overflow, allow normal wrap
  avgRow.innerHTML = `
    <td colspan="5" class="px-4 py-3 text-right font-bold text-slate-300 border-t border-slate-600">
       <span class="mr-2">Avg Time:</span> <span class="text-cyan-400 text-xl">${avgTime}s</span>
    </td>
  `;
  summaryBody.appendChild(avgRow);
}
