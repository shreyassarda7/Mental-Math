import { db } from "./firebase.js";
import { collection, addDoc, query, where, orderBy, limit, getDocs }
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const LOCAL_KEY = 'mental_math_sessions';

export const storageManager = {

    async saveSession(data, user) {
        if (user && !user.isAnonymous) {
            // Cloud Save
            try {
                await addDoc(collection(db, "sessions"), data);
                console.log("Saved to Cloud");
            } catch (e) {
                console.error("Cloud save failed", e);
                // Fallback or just log? For now just log.
            }
        } else {
            // Local Save
            const history = this.getLocalHistory();
            history.unshift(data); // Add to top
            // Keep last 50 locally
            if (history.length > 50) history.pop();
            localStorage.setItem(LOCAL_KEY, JSON.stringify(history));
            console.log("Saved to LocalStorage");
        }
    },

    async getHistory(user, limitCount = 10) {
        if (user && !user.isAnonymous) {
            // Cloud Fetch
            const q = query(
                collection(db, "sessions"),
                where("uid", "==", user.uid),
                orderBy("ts", "desc"),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data());
        } else {
            // Local Fetch
            const history = this.getLocalHistory();
            return history.slice(0, limitCount);
        }
    },

    getLocalHistory() {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Local read failed", e);
            return [];
        }
    },

    // Helper to convert Firebase Timestamp or String Date to JS Date
    parseDate(ts) {
        if (!ts) return new Date();
        if (ts.toDate) return ts.toDate(); // Firebase Timestamp
        return new Date(ts); // String or JS Date
    }
};
