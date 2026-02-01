import { generateQuestion } from "./questions.js";

export let state = {
  idx:0,
  score:0,
  questions:[],
  startTime:0
};

export function initQuiz(){
  state.idx=0;
  state.score=0;
  state.questions=[];
  for(let i=1;i<=20;i++)
    state.questions.push(generateQuestion(i));
}

export function currentQ(){
  return state.questions[state.idx];
}

export function submit(ans){
  let q=currentQ();
  let correct = String(ans)===String(q.answer);

  q.userAnswer=ans;
  q.correct=correct;

  if(correct) state.score++;

  state.idx++;
  return correct;
}

export function finished(){
  return state.idx>=20;
}
