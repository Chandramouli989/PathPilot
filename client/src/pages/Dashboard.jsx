import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpenCheck, CheckCircle2, Compass, Map, Sparkles, TrendingUp } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Notice from "../components/Notice";

export default function Dashboard() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get("/assessments"), api.get("/roadmaps")]).then(([assessmentResult, roadmapResult]) => {
      if (assessmentResult.status === "fulfilled") setAssessment(assessmentResult.value.data.assessment || assessmentResult.value.data.data || null);
      else if (assessmentResult.reason.response?.status !== 404) setError(assessmentResult.reason.response?.data?.message || "Could not load your assessment.");
      if (roadmapResult.status === "fulfilled") setRoadmaps(roadmapResult.value.data.roadmaps || []);
      else setError(current => current || roadmapResult.reason.response?.data?.message || "Could not load roadmap progress.");
    }).finally(() => setLoading(false));
  }, []);

  const completedMilestones = roadmaps.reduce((sum, item) => sum + item.phases.flatMap(phase => phase.milestones).filter(m => m.status === "completed").length, 0);
  const totalMilestones = roadmaps.reduce((sum, item) => sum + item.phases.reduce((phaseSum, phase) => phaseSum + phase.milestones.length, 0), 0);
  const completed = Boolean(assessment);

  return (
    <div className="page-stack">
      <section className="welcome-panel"><div><span className="pill pill-light">YOUR CAREER JOURNEY</span><h2>Welcome back, {user?.name?.split(" ")[0] || "there"}.</h2><p>Small steps today can help you make confident career decisions tomorrow.</p></div><div className="welcome-art"><Compass size={76} strokeWidth={1.1} /></div></section>
      <Notice>{error}</Notice>
      <div className="section-heading"><div><span className="eyebrow">OVERVIEW</span><h2>Your progress</h2></div></div>
      <div className="stats-grid">
        <article className="stat-card"><div className="stat-icon violet"><BookOpenCheck /></div><span>Career assessment</span><strong>{loading ? "..." : completed ? "Completed" : "Not started"}</strong><small>{completed ? "Your profile is ready to explore" : "Tell us about your interests and skills"}</small></article>
        <article className="stat-card"><div className="stat-icon green"><CheckCircle2 /></div><span>Milestones completed</span><strong>{loading ? "..." : `${completedMilestones}/${totalMilestones}`}</strong><small>Across your saved career roadmaps</small></article>
        <article className="stat-card"><div className="stat-icon amber"><Map /></div><span>Active roadmaps</span><strong>{loading ? "..." : roadmaps.length}</strong><small>{totalMilestones ? "Keep moving toward your target role" : "Create a plan for your next role"}</small></article>
      </div>
      <section className="action-grid">
        <article className="action-card"><div className="action-icon"><BookOpenCheck /></div><span className="eyebrow">STEP 01</span><h3>{completed ? "Review your assessment" : "Complete your assessment"}</h3><p>Share your education, skills, interests, strengths and preferred work style.</p><Link className="text-link" to="/assessment">{completed ? "View assessment" : "Start assessment"} <ArrowUpRight size={16} /></Link></article>
        <article className="action-card featured-action"><div className="action-icon"><Sparkles /></div><span className="eyebrow">STEP 02</span><h3>Turn a career idea into a plan</h3><p>Generate a personalized roadmap and track learning milestones from start to finish.</p><Link className="text-link" to="/roadmaps">Open my roadmaps <ArrowUpRight size={16} /></Link></article>
      </section>
      <section className="progress-teaser">
        <div className="progress-teaser-icon"><TrendingUp size={20} /></div>
        <div><span className="eyebrow">STAY ON TRACK</span><h3>See your career progress</h3><p>Review completed milestones, learning effort and progress across your roadmap phases.</p></div>
        <Link className="text-link" to="/progress">View analytics <ArrowUpRight size={16} /></Link>
      </section>
    </div>
  );
}
