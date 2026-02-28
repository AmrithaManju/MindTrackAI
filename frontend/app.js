import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FIREBASE CONFIG (This is safe to keep public)
const firebaseConfig = {
  apiKey: "AIzaSyDY0iKTGwr2Zoc3bx6fACSDHFEXDzoSxIU",
  authDomain: "mindtrackai-58f00.firebaseapp.com",
  projectId: "mindtrackai-58f00",
  storageBucket: "mindtrackai-58f00.firebasestorage.app",
  messagingSenderId: "1047810212183",
  appId: "1:1047810212183:web:e3c7c1606d25e21b603e12",
  measurementId: "G-WXPLP66RSQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. UI ELEMENTS
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const moodCtx = document.getElementById('moodChart').getContext('2d');

// 3. CHART SETUP
let moodChart = new Chart(moodCtx, {
    type: 'line',
    data: { 
        labels: [], 
        datasets: [{ 
            label: 'Mood Level', 
            data: [], 
            borderColor: '#6c63ff', 
            tension: 0.4 
        }] 
    },
    options: { 
        scales: { 
            y: { min: 1, max: 10 } 
        } 
    }
});

// 4. FUNCTION TO TALK TO BACKEND (NOT GEMINI DIRECTLY)
async function getAIResponse(text) {
    try {
        const response = await fetch("https://mindtrackai.onrender.com/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        return data.reply;

    } catch (error) {
        console.error("Backend Error:", error);
        return "I'm here for you. Something went wrong. Please try again. [SCORE: 5]";
    }
}

// 5. SEND MESSAGE LOGIC
sendBtn.onclick = async () => {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message
    chatWindow.innerHTML += `<div class="user-msg">${text}</div>`;
    userInput.value = "";

    // Scroll anchor
    let scrollAnchor = document.getElementById('scroll-anchor');
    if (!scrollAnchor) {
        scrollAnchor = document.createElement('div');
        scrollAnchor.id = 'scroll-anchor';
        chatWindow.appendChild(scrollAnchor);
    }
    scrollAnchor.scrollIntoView({ behavior: 'smooth' });

    // Get AI response from backend
    const aiRawResponse = await getAIResponse(text);

    // Extract mood score
    const scoreMatch = aiRawResponse.match(/\[SCORE:\s*(\d+)\]/);
    const moodScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;

    const cleanReply = aiRawResponse.replace(/\[SCORE:\s*\d+\]/g, "");

    // Add bot message
    chatWindow.innerHTML += `<div class="bot-msg">${cleanReply}</div>`;

    chatWindow.appendChild(scrollAnchor);
    scrollAnchor.scrollIntoView({ behavior: 'smooth' });

    // Save to Firestore
    await addDoc(collection(db, "moods"), {
        text: text,
        score: moodScore,
        timestamp: serverTimestamp()
    });
};

// 6. REAL-TIME CHART UPDATES
const q = query(collection(db, "moods"), orderBy("timestamp", "asc"));

onSnapshot(q, (snapshot) => {
    const scores = [];
    const labels = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        scores.push(data.score);

        const time = data.timestamp?.toDate();
        labels.push(time ? time.toLocaleTimeString() : "");
    });

    moodChart.data.labels = labels;
    moodChart.data.datasets[0].data = scores;
    moodChart.update();
});
