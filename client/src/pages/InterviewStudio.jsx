import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Target, Clock3, ChevronRight, ArrowLeft, Sparkles, History, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

const ROLES = ["Frontend Developer", "Full Stack Developer", "Backend Developer", "Software Engineer"];
const CATEGORIES = ["All", "Technical", "Project", "Behavioral"];

export default function InterviewStudio() {
  const [role, setRole] = useState("Full Stack Developer");
  const [category, setCategory] = useState("All");
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let activeRequest = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [questionResponse, historyResponse] = await Promise.all([
          api.get("/interviews/questions", { params: { role, category }, signal: controller.signal }),
          api.get("/interviews/history", { signal: controller.signal })
        ]);
        if (!activeRequest) return;
        setQuestions(questionResponse.data.questions || []);
        setHistory(historyResponse.data.attempts || []);
      } catch (err) {
        if (activeRequest && err.code !== "ERR_CANCELED") {
          setError(err.response?.data?.message || "Unable to load interview practice.");
        }
      } finally {
        if (activeRequest) setLoading(false);
      }
    };

    load();
    return () => {
      activeRequest = false;
      controller.abort();
    };
  }, [role, category]);

  const attemptsByQuestion = useMemo(() => {
    const map = {};
    history.forEach(item => { if (!map[item.questionId]) map[item.questionId] = item; });
    return map;
  }, [history]);

  const start = question => {
    setActive(question);
    setAnswer("");
    setFeedback(null);
    setError("");
    setNotice("");
  };

  const submit = async event => {
    event.preventDefault();
    if (!active) return;
    setEvaluating(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/interviews/evaluate", {
        role, questionId: active.id, answer
      });
      setFeedback(response.data.attempt);
      setHistory(current => [response.data.attempt, ...current]);
      setNotice(response.data.message || "Feedback saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to evaluate your answer.");
    } finally { setEvaluating(false); }
  };

  const back = () => { setActive(null); setFeedback(null); setAnswer(""); setError(""); setNotice(""); };

  return <div className="interview-studio-page">
    <section className="interview-studio-hero">
      <div><span className="eyebrow">PRACTICE · REFLECT · IMPROVE</span>
        <h2>Interview Preparation Studio</h2>
        <p>Practice role-specific technical, project and behavioral questions. Write your answer and receive structured feedback on relevance, clarity, structure and specific examples.</p>
      </div><div className="interview-hero-icon"><BrainCircuit size={34}/></div>
    </section>

    {error && <div className="interview-alert">{error}</div>}
    {notice && <div className="interview-notice">{notice}</div>}

    {!active ? <>
      <section className="interview-controls">
        <label>Target role<select value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Question type<select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
        <div className="interview-count"><Target size={17}/><strong>{questions.length}</strong> practice questions</div>
      </section>

      <section className="interview-question-grid">
        {loading ? <div className="interview-empty">Loading interview questions...</div> : questions.map(question => {
          const last = attemptsByQuestion[question.id];
          return <article className="interview-question-card" key={question.id}>
            <div className="interview-question-meta"><span className={`interview-category category-${question.category.toLowerCase()}`}>{question.category}</span><span>{question.difficulty}</span></div>
            <h3>{question.prompt}</h3>
            {last && <div className="interview-last-practice"><CheckCircle2 size={14}/> Practiced · {last.feedback.score}/100</div>}
            <button onClick={() => start(question)}>Practice this question <ChevronRight size={16}/></button>
          </article>;
        })}
        {!loading && questions.length === 0 && <div className="interview-empty">No questions found for this filter.</div>}
      </section>

      <section className="interview-history">
        <h3><History size={18}/> Your recent practice</h3>
        {history.length ? history.slice(0, 8).map(item => <div className="interview-history-row" key={item._id}>
          <div><strong>{item.question}</strong><small>{item.role} · {item.category} · {new Date(item.createdAt).toLocaleDateString()}</small></div>
          <span>{item.feedback.score}/100</span>
        </div>) : <p>You haven't practiced any interview questions yet. Start with a question above.</p>}
      </section>
    </> : <section className="interview-practice-panel">
      <button className="interview-back" onClick={back}><ArrowLeft size={16}/> All questions</button>
      <div className="interview-active-meta"><span className={`interview-category category-${active.category.toLowerCase()}`}>{active.category}</span><span>{active.difficulty}</span><span><Clock3 size={13}/> Suggested: 2–3 minutes</span></div>
      <h3>{active.prompt}</h3>
      <p className="interview-guidance">Answer as if you are speaking to an interviewer. Use your own experience; do not invent achievements or claim skills you cannot demonstrate.</p>
      <form onSubmit={submit} className="interview-answer-form">
        <label htmlFor="interview-answer">Your answer</label>
        <textarea id="interview-answer" rows="9" maxLength="8000" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Structure your response clearly. For behavioral questions, consider Situation, Task, Action and Result (STAR)." />
        <div className="interview-answer-footer"><span>{answer.length}/8,000 characters · Aim for a clear, specific response.</span><button className="interview-primary" disabled={evaluating || answer.trim().length < 10}><Sparkles size={16}/>{evaluating ? "Evaluating..." : "Evaluate my answer"}</button></div>
      </form>

      {feedback && <section className="interview-feedback">
        <div className="interview-feedback-heading"><div><span className="eyebrow">ANSWER REVIEW</span><h3>Feedback on your response</h3></div><div className="interview-score"><strong>{feedback.feedback.score}</strong><span>/100</span></div></div>
        <p className="interview-feedback-overall">{feedback.feedback.overall}</p>
        <div className="interview-rubric">{[
          ["Relevance", feedback.feedback.rubric.relevance],
          ["Clarity", feedback.feedback.rubric.clarity],
          ["Structure", feedback.feedback.rubric.structure],
          ["Specificity", feedback.feedback.rubric.specificity]
        ].map(([label, score]) => <div key={label}><span>{label}</span><strong>{score}/5</strong><div className="interview-rubric-track"><i style={{width:`${score*20}%`}}/></div></div>)}</div>
        <div className="interview-feedback-columns">
          <div><h4>What worked</h4>{feedback.feedback.strengths.map((item,i)=><p key={i}><CheckCircle2 size={15}/>{item}</p>)}</div>
          <div><h4>What to improve</h4>{feedback.feedback.improvements.map((item,i)=><p key={i}><Target size={15}/>{item}</p>)}</div>
        </div>
        <div className="interview-structure"><strong>Suggested answer structure</strong><p>{feedback.feedback.suggestedStructure}</p></div>
        <small className="interview-feedback-mode">{feedback.feedbackMode === "groq_ai" ? "AI-generated practice feedback" : "Basic automated feedback (AI service unavailable)"} · This is coaching feedback, not a hiring score or verified assessment.</small>
        <button className="interview-primary interview-try-again" onClick={() => {setAnswer("");setFeedback(null);setNotice("");}}>Try this question again</button>
      </section>}
    </section>}
    <p className="interview-disclaimer">Your practice answers are saved to your account so you can review progress. Feedback is guidance for improvement; it cannot guarantee interview performance or hiring outcomes.</p>
  </div>;
}
