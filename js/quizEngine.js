import { generateQuestions, getQuestion } from "./questions.js";
import { logEvent } from "./logger.js";

export let state = {
  idx: 0,
  score: 0,
  questions: [],
  startTime: 0,
  streak: 0,
  maxStreak: 0,
  qStartTime: 0
};

export function initQuiz(mode = 'standard', count = 20) {
  state.idx = 0;
  state.score = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.questions = generateQuestions(mode, count);
  logEvent("QUIZ_INIT", { mode, count, questionCount: state.questions.length });
}

export function startQuestionTimer() {
  state.qStartTime = Date.now();
}

export function currentQ() {
  return state.questions[state.idx];
}

// Unified Answer Parser - handles fractions like "3/4" -> 0.75
function parseVal(val) {
  // 1. Log the EXACT input received
  console.log(`[ParseVal] Raw Input: '${val}' Type: ${typeof val}`);

  if (typeof val !== 'string') return val;

  // 2. Clean the input (Trim whitespace)
  val = val.trim();

  // Handle Fractions "a/b" -> decimal
  if (val.includes('/')) {
    const parts = val.split('/');
    console.log(`[ParseVal] Split Parts:`, parts);

    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);

      console.log(`[ParseVal] Num: ${numerator}, Denom: ${denominator}`);

      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // Handle decimals or integers
  return parseFloat(val);
}

export function submit(ans) {
  let q = currentQ();
  let correct = false;

  // Division questions use strict string matching ("5 R 2")
  if (q.type === 'div') {
    correct = String(ans).trim() === String(q.answer).trim();
  }
  // All other questions use numeric comparison with tolerance
  else {
    let userVal = parseVal(ans);
    let correctVal = parseVal(q.answer);

    if (!isNaN(userVal) && !isNaN(correctVal)) {
      correct = Math.abs(userVal - correctVal) < 0.01;
    }
  }

  // Logic: Calculate metrics
  const timeTaken = (Date.now() - state.qStartTime) / 1000;
  q.timeTaken = timeTaken;
  q.userAnswer = ans;
  q.correct = correct;

  if (correct) {
    state.score++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
  } else {
    state.streak = 0;
  }

  logEvent("ANSWER_SUBMIT", {
    qIdx: state.idx,
    isCorrect: correct,
    streak: state.streak,
    time: timeTaken
  });

  state.idx++;
  return correct;
}

export function finished() {
  return state.idx >= state.questions.length;
}
