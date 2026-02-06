import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { getFirestore, addDoc, collection, query, where, getDocs, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCv-NvLqMxj-2a_4j3uoVbn3Vog2UvJyl4",
  authDomain: "mental-math-v2.firebaseapp.com",
  projectId: "mental-math-v2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export let currentUser = null;

export async function initAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (callback) callback(user);
  });

  // Auto-sign in anonymously if not logged in
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

export async function loginGoogle() {
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
}

