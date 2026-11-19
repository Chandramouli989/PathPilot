const getGroqClient = require("../config/groq");

const DEFAULT_MODEL = "openai/gpt-oss-20b";

async function createChatCompletion(messages, options = {}) {
  const client = getGroqClient();
  const timeout = Number(options.timeout) > 0 ? Number(options.timeout) : 30000;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  return client.chat.completions.create(
    {
      messages,
      model,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1800,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {})
    },
    { timeout }
  );
}

function parseJsonResponse(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("AI returned an empty response.");
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { createChatCompletion, parseJsonResponse };
