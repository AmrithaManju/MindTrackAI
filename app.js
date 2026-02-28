import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. YOUR FIREBASE CONFIG
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

// 2. GEMINI AI CONFIG
// Change this in app.js
// 2. GEMINI AI CONFIG (Updated for 2026)
const GEMINI_API_KEY = "AIzaSyCHgLij_Vl4d3trvz_GqLqICp5BgV4YY3s"; 

// Using the 'latest' alias is safer than a version number
const MODEL_NAME = "gemini-2.5-flash"; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
// 3. UI ELEMENTS
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const moodCtx = document.getElementById('moodChart').getContext('2d');

// 4. THE CHART SETUP
let moodChart = new Chart(moodCtx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Mood Level', data: [], borderColor: '#6c63ff', tension: 0.4 }] },
    options: { scales: { y: { min: 1, max: 10 } } }
});

// 5. FUNCTION TO TALK TO AI

async function getAIResponse(text) {

const prompt = `You are a proactive mental health coach. 

Analyze the user's input: "${text}". 

1. Provide one empathetic sentence.

2. Provide very good and actionable suggestion to help them (e.g., a physical exercise, a mental framing technique,good for to eat or a small habit). 
3.Helpline numbers (only if things seem serious): police: 100, hospital: 108, mental health helpline: 080-2553-0000(give these according to
situations,if they are facing something like mental health issues, give them mental health helpline number, if they are facing something like physical health issues, 
give them hospital number and if they are facing something like abuse, give them police number)

4. End with a mood score 1-10 in this exact format: [SCORE: X]`;



    const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Added this header
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    
    // Check if the response actually has content to avoid the 'reading 0' error
    if (data.candidates && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error("Gemini Error:", data);
        return "I'm here for you. How are you feeling right now? [SCORE: 5]";
    }
}

// 6. SEND MESSAGE 

// 6. SEND MESSAGE LOGIC (Robust Scroll Fix)
sendBtn.onclick = async () => {
    const text = userInput.value;
    if (!text) return;

    // 1. Add user message
    chatWindow.innerHTML += `<div class="user-msg">${text}</div>`;
    userInput.value = "";
    
    // Create or find a "scroll anchor" at the bottom
    let scrollAnchor = document.getElementById('scroll-anchor');
    if (!scrollAnchor) {
        scrollAnchor = document.createElement('div');
        scrollAnchor.id = 'scroll-anchor';
        chatWindow.appendChild(scrollAnchor);
    }

    // Scroll to the bottom immediately
    scrollAnchor.scrollIntoView({ behavior: 'smooth' });

    // 2. Get AI response
    const aiRawResponse = await getAIResponse(text);
    
    // Extract score and clean text
    const scoreMatch = aiRawResponse.match(/\[SCORE:\s*(\d+)\]/);
    const moodScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    const cleanReply = aiRawResponse.replace(/\[SCORE:\s*\d+\]/g, "");

    // 3. Add bot message
    chatWindow.innerHTML += `<div class="bot-msg">${cleanReply}</div>`;
    
    // Move the anchor to the end again and scroll
    chatWindow.appendChild(scrollAnchor);
    scrollAnchor.scrollIntoView({ behavior: 'smooth' });
    
    // 4. SAVE TO FIREBASE
    await addDoc(collection(db, "moods"), {
        text: text,
        score: moodScore,
        timestamp: serverTimestamp()
    });
};
// 7. REAL-TIME CHART UPDATES
const q = query(collection(db, "moods"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
    const scores = [];
    const labels = [];
    snapshot.forEach(doc => {
        scores.push(doc.data().score);
        labels.push(new Date(doc.data().timestamp?.toDate()).toLocaleTimeString());
    });
    moodChart.data.labels = labels;
    moodChart.data.datasets[0].data = scores;
    moodChart.update();
});