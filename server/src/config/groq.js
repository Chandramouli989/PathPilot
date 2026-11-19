const Groq = require("groq-sdk");

let client;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  return client;
}

module.exports = getGroqClient;
