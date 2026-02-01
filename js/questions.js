// Question pool - generated once per quiz, not per question
let questionPool = [];

export function generateQuestions() {
  questionPool = [];

  // 10 basic questions
  for (let j = 0; j < 10; j++) questionPool.push(basic());

  // 5 double multiplication
  for (let j = 0; j < 5; j++) questionPool.push(doubleMult());

  // 3 division
  for (let j = 0; j < 3; j++) questionPool.push(division());

  // 2 fractions
  for (let j = 0; j < 2; j++) questionPool.push(fraction());

  // Shuffle once
  shuffle(questionPool);

  return questionPool;
}

export function getQuestion(i) {
  return questionPool[i];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function basic() {
  let a = rand(2, 20), b = rand(2, 20);
  return { text: `${a} × ${b}`, answer: a * b, type: "basic" };
}

function doubleMult() {
  let a = rand(10, 99), b = rand(10, 99);
  return { text: `${a} × ${b}`, answer: a * b, type: "double" };
}

function division() {
  let d = rand(2, 12);
  let q = rand(5, 30);
  let r = rand(0, d - 1);
  let n = d * q + r;
  return { text: `${n} ÷ ${d}`, answer: `${q} R ${r}`, type: "div" };
}

function fraction() {
  // Generate truly random fractions
  const n1 = rand(1, 5);
  const d1 = rand(2, 8);
  const n2 = rand(1, 5);
  const d2 = rand(2, 8);

  // Calculate the answer as decimal
  const answer = (n1 / d1) + (n2 / d2);

  return {
    text: `${n1}/${d1} + ${n2}/${d2}`,
    answer: parseFloat(answer.toFixed(4)),
    type: "frac"
  };
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
