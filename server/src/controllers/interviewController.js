const InterviewAttempt = require("../models/InterviewAttempt");
const bank = require("../services/interviewQuestionBank");

const { createChatCompletion, parseJsonResponse } = require("../services/aiService");

function fallbackFeedback(question, answer, focus) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lower = answer.toLowerCase();
  const matched = focus.filter(term => lower.includes(term.toLowerCase()));
  const hasExample = /\b(for example|for instance|e\.g\.|such as|in my project|i built|i implemented)\b/i.test(answer);
  const hasStructure = /\b(first|second|then|because|therefore|result|finally|learned)\b/i.test(answer);
  const relevance = Math.min(5, 1 + Math.round((matched.length / Math.max(focus.length, 1)) * 4));
  const clarity = words.length >= 45 ? 4 : words.length >= 20 ? 3 : words.length >= 8 ? 2 : 1;
  const structure = hasStructure ? 4 : words.length >= 25 ? 3 : 2;
  const specificity = hasExample ? 4 : 2;
  const score = Math.round(((relevance + clarity + structure + specificity) / 20) * 100);
  return {
    overall: words.length < 12
      ? "Your response is too brief to demonstrate your reasoning. Expand it with a direct answer, explanation and a concrete example."
      : `This is a preliminary practice review based on answer length and detectable structure. Your response contains ${words.length} words. Review the question's key expectations and add a specific example.`,
    strengths: [
      words.length >= 20 ? "You provided enough detail to begin evaluating your explanation." : "You attempted the question and established a starting point.",
      hasStructure ? "Your answer includes sequencing or result-oriented language." : "You have an opportunity to make the answer easier to follow."
    ],
    improvements: [
      matched.length < Math.ceil(focus.length / 2) ? `Address more of the question's core areas: ${focus.join(", ")}.` : "Explain each key point with a precise example rather than only naming it.",
      hasExample ? "Clarify your personal contribution and the outcome of the example." : "Add a concrete example from a project, assignment or practical situation.",
      "Finish with the result, trade-off or lesson learned where relevant."
    ],
    suggestedStructure: "Start with a direct one-sentence answer. Explain the reasoning or steps. Give a specific example. Close with the result or key takeaway.",
    score,
    rubric: { relevance, clarity, structure, specificity }
  };
}

async function aiFeedback(question, answer, focus) {
  const completion = await createChatCompletion(
    [
      {
        role: "system",
        content: "You are a fair, constructive interview coach for entry-level software engineering candidates. Evaluate only what the candidate actually wrote. Do not invent experience or claim facts not in the answer. Do not reward keyword stuffing. Be supportive but candid. Return valid JSON only with keys: overall (string), strengths (array of 1-3 short strings), improvements (array of 2-4 short strings), suggestedStructure (string), score (integer 0-100), rubric (object with relevance, clarity, structure, specificity each integer 0-5). Score the quality of this answer, not the candidate's employability. If the answer is technically wrong or vague, say so."
      },
      {
        role: "user",
        content: JSON.stringify({ question, candidateAnswer: answer, evaluationFocus: focus })
      }
    ],
    { timeout: 12000, temperature: 0.2, maxTokens: 900 }
  );

  const parsed = parseJsonResponse(completion.choices?.[0]?.message?.content);
  const rubric = parsed.rubric || {};
  const numeric = key => Math.max(0, Math.min(5, Math.round(Number(rubric[key]) || 0)));
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
  const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
  const improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];

  if (typeof parsed.overall !== "string" || !parsed.overall.trim() ||
      typeof parsed.suggestedStructure !== "string" || !parsed.suggestedStructure.trim() ||
      strengths.length < 1 || strengths.length > 3 ||
      improvements.length < 2 || improvements.length > 4 ||
      [...strengths, ...improvements].some(value => typeof value !== "string" || !value.trim())) {
    throw new Error("AI returned incomplete interview feedback.");
  }

  const rubricValues = ["relevance", "clarity", "structure", "specificity"].map(numeric);
  const rubricAverage = rubricValues.reduce((sum, value) => sum + value, 0) / 20 * 100;
  if (Math.abs(score - rubricAverage) > 35) {
    throw new Error("AI feedback score is inconsistent with its rubric.");
  }

  return {
    overall: parsed.overall.trim().slice(0, 2500),
    strengths: strengths.map(value => value.trim().slice(0, 300)),
    improvements: improvements.map(value => value.trim().slice(0, 300)),
    suggestedStructure: parsed.suggestedStructure.trim().slice(0, 2000),
    score,
    rubric: { relevance: rubricValues[0], clarity: rubricValues[1], structure: rubricValues[2], specificity: rubricValues[3] }
  };
}

exports.listQuestions = (req, res) => {
  const role = String(req.query.role || "Full Stack Developer");
  const category = String(req.query.category || "All");
  res.json({ success: true, roles: bank.roles, questions: bank.list(role, category) });
};

exports.evaluate = async (req, res) => {
  try {
    const role = String(req.body.role || "Full Stack Developer");
    const questionId = String(req.body.questionId || "");
    const answer = typeof req.body.answer === "string" ? req.body.answer.trim() : "";
    if (!bank.roles.includes(role)) return res.status(400).json({ success: false, message: "Choose a supported interview role." });
    if (!answer || answer.length < 10) return res.status(400).json({ success: false, message: "Write at least 10 characters before requesting feedback." });
    if (answer.length > 8000) return res.status(400).json({ success: false, message: "Keep your answer under 8,000 characters." });
    const question = bank.get(role, questionId);
    if (!question) return res.status(404).json({ success: false, message: "Interview question not found." });

    let feedback;
    let feedbackMode = "groq_ai";
    try {
      feedback = await aiFeedback(question.prompt, answer, question.focus);
      if (!feedback) {
        feedback = fallbackFeedback(question.prompt, answer, question.focus);
        feedbackMode = "rule_based_fallback";
      }
    } catch (error) {
      const reason = error.name === "AbortError"
        ? "Groq evaluation timed out after 12 seconds"
        : error.message;
      console.error("Interview AI feedback error:", reason);
      feedback = fallbackFeedback(question.prompt, answer, question.focus);
      feedbackMode = "rule_based_fallback";
    }

    const attempt = await InterviewAttempt.create({
      user: req.user.userId, role, questionId, category: question.category,
      question: question.prompt, answer, feedback, feedbackMode
    });
    res.status(201).json({
      success: true,
      message: "Interview practice answer evaluated and saved.",
      attempt: {
        _id: attempt._id, role: attempt.role, questionId: attempt.questionId,
        category: attempt.category, question: attempt.question, answer: attempt.answer,
        feedback: attempt.feedback, feedbackMode: attempt.feedbackMode,
        createdAt: attempt.createdAt
      }
    });
  } catch (error) {
    console.error("Interview evaluation error:", error);
    res.status(500).json({ success: false, message: "Unable to evaluate this answer. Please try again." });
  }
};

exports.history = async (req, res) => {
  try {
    const attempts = await InterviewAttempt.find({ user: req.user.userId })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, attempts });
  } catch (error) {
    console.error("Interview history error:", error);
    res.status(500).json({ success: false, message: "Unable to load interview practice history." });
  }
};
