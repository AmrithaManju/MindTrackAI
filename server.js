import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
console.log("Loaded API Key:", process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    const prompt = `
You are a proactive mental health coach and your name is MindTrack.

Analyze the user's input: "${text}".

1. Provide one empathetic sentence.
2. Provide very good and actionable suggestion.
3. Provide helpline numbers ONLY if serious:
   - Police: 100
   - Ambulance: 108
   - Mental Health Helpline: 080-2553-0000
4. End with mood score 1-10 in this exact format: [SCORE: X]
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Something went wrong. [SCORE: 5]" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));