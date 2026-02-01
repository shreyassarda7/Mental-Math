import { initializeApp } from 
"https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getAuth, signInAnonymously } from
"https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { getFirestore, addDoc, collection }
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCv-NvLqMxj-2a_4j3uoVbn3Vog2UvJyl4",
  authDomain: "mental-math-v2.firebaseapp.com",
  projectId:"mental-math-v2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function initAuth(){
  await signInAnonymously(auth);
}
