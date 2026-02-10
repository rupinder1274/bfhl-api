const express = require("express");
require("dotenv").config();
console.log("GEMINI KEY LOADED:", process.env.GEMINI_API_KEY ? "YES" : "NO");


const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* -------------------- AI FUNCTION -------------------- */
const axios = require("axios");

async function getAIResponse(question) {
  if (typeof question !== "string" || question.trim() === "") {
    throw new Error("AI input must be a non-empty string");
  }
  const prompt = `Answer the following question in exactly ONE word only. No explanations, no punctuation, just the single word answer:\n\n${question}`;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const text =
      response.data.candidates[0].content.parts[0].text.trim();

    // Ensure ONE WORD only
    return text.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "") || "Unknown";

  } catch (error) {
    console.error(
      "GEMINI HTTP ERROR:",
      error.response?.data || error.message
    );
    throw new Error("AI processing failed");
  }
}



/* -------------------- HEALTH API -------------------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: process.env.CHITKARA_EMAIL
  });
});

/* -------------------- BFHL API -------------------- */
app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: process.env.CHITKARA_EMAIL,
        error: "Exactly one key is required"
      });
    }

    const key = keys[0];
    const value = body[key];
    let result;

    /* Fibonacci */
    if (key === "fibonacci") {
      if (typeof value !== "number" || value < 0) {
        throw new Error("Invalid fibonacci input");
      }

      let fib = [];
      let a = 0, b = 1;

      for (let i = 0; i < value; i++) {
        fib.push(a);
        [a, b] = [b, a + b];
      }

      result = fib;
    }

    /* Prime */
    else if (key === "prime") {
      if (!Array.isArray(value)) {
        throw new Error("Prime input must be an array");
      }

      const isPrime = (n) => {
        if (n < 2) return false;
        for (let i = 2; i <= Math.sqrt(n); i++) {
          if (n % i === 0) return false;
        }
        return true;
      };

      result = value.filter(isPrime);
    }

    /* HCF */
    else if (key === "hcf") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("HCF input must be a non-empty array");
      }

      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      result = value.reduce((a, b) => gcd(a, b));
    }

    /* LCM */
    else if (key === "lcm") {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("LCM input must be a non-empty array");
      }

      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const lcm = (a, b) => (a * b) / gcd(a, b);

      result = value.reduce((a, b) => lcm(a, b));
    }

    /* AI */
    else if (key === "AI") {
      result = await getAIResponse(value);
    }

    else {
      throw new Error("Invalid key");
    }

    res.status(200).json({
      is_success: true,
      official_email: process.env.CHITKARA_EMAIL,
      data: result
    });

  } catch (err) {
    res.status(400).json({
      is_success: false,
      official_email: process.env.CHITKARA_EMAIL,
      error: err.message
    });
  }
});

/* -------------------- SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
