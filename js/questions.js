// Question pool - generated once per quiz
let questionPool = [];

export function generateQuestions(mode = 'standard', count = 20) {
  questionPool = [];

  if (mode === 'trader') {
    // Trader Mode: Dynamic count (20 or 40)
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      if (r < 0.4) questionPool.push(traderAdd());
      else if (r < 0.8) questionPool.push(traderSub());
      else questionPool.push(traderMult());
    }
  } else if (mode === 'memory') {
    // Memory Mode: 20 questions
    // 10 short (3 step), 10 long (5 step)
    for (let i = 0; i < 10; i++) questionPool.push(memoryChain(3));
    for (let i = 0; i < 10; i++) questionPool.push(memoryChain(5));
    shuffle(questionPool);
  } else {
    // Standard Mode (Fixed 20)
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
  }

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

function traderAdd() {
  const a = rand(10, 99);
  const b = rand(10, 99);
  return { text: `${a} + ${b}`, answer: a + b, type: 'trader' };
}

function traderSub() {
  const a = rand(50, 150);
  const b = rand(10, 50);
  return { text: `${a} - ${b}`, answer: a - b, type: 'trader' };
}

function traderMult() {
  const a = rand(2, 12);
  const b = rand(11, 25);
  return { text: `${a} × ${b}`, answer: a * b, type: 'basic' }; // reuse basic type
}

function memoryChain(steps) {
  // Start with a decent number
  let val = rand(2, 20);
  let text = `${val}`;

  for (let i = 0; i < steps; i++) {
    // Decide operation: 0:+, 1:-, 2:* (rare), 3:/ (if possible)
    let opType = rand(0, 3);
    let n = 0;

    // Division Check
    if (opType === 3) {
      // Find factors
      const factors = [];
      for (let k = 2; k <= Math.abs(val); k++) {
        if (val % k === 0) factors.push(k);
      }

      if (factors.length > 0 && val !== 0) {
        // Pick a random factor
        n = factors[rand(0, factors.length - 1)];
        val /= n;
        text += ` ÷ ${n}`;
      } else {
        opType = 0; // Fallback to add
      }
    }

    if (opType === 2) {
      // Multiply (keep small to avoid explosion)
      n = rand(2, 4);
      val *= n;
      text += ` × ${n}`;
    }

    if (opType === 0) {
      n = rand(2, 20);
      val += n;
      text += ` + ${n}`;
    }

    if (opType === 1) {
      n = rand(2, 20);
      val -= n;
      text += ` - ${n}`;
    }
  }

  return { text: text, answer: val, type: 'memory' };
}


function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
