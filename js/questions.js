export function generateQuestion(i){
  if(i<=10) return basic();
  if(i<=15) return doubleMult();
  if(i<=18) return division();
  return fraction();
}

function basic(){
  let a=rand(2,20), b=rand(2,20);
  return { text:`${a} × ${b}`, answer:a*b, type:"basic"};
}

function doubleMult(){
  let a=rand(10,99), b=rand(10,99);
  return { text:`${a} × ${b}`, answer:a*b, type:"double"};
}

function division(){
  let d=rand(2,12);
  let q=rand(5,30);
  let r=rand(0,d-1);
  let n=d*q+r;
  return { text:`${n} ÷ ${d}`, answer:`${q} R ${r}`, type:"div"};
}

function fraction(){
  return { text:"1/2 + 1/4", answer:0.75, type:"frac"};
}

function rand(a,b){
  return Math.floor(Math.random()*(b-a+1))+a;
}
