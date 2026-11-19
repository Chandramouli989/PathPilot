import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, Clock3, RefreshCw, Sparkles, Target } from "lucide-react";
import api from "../api/axios";
import Notice from "../components/Notice";

function RoadmapCard({ roadmap, onStatusChange }) {
  const [expanded, setExpanded] = useState(true);
  const allMilestones = roadmap.phases.flatMap(phase => phase.milestones);
  const completed = allMilestones.filter(item => item.status === "completed").length;
  const progress = allMilestones.length ? Math.round((completed / allMilestones.length) * 100) : 0;

  return (
    <article className="roadmap-card">
      <div className="roadmap-card-head">
        <div>
          <span className="eyebrow">PERSONALIZED LEARNING PLAN</span>
          <h3>{roadmap.careerTitle}</h3>
          <p>{roadmap.overview}</p>
        </div>
        <button className="icon-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Collapse roadmap" : "Expand roadmap"}>
          {expanded ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
        </button>
      </div>
      <div className="roadmap-meta"><span><Clock3 size={15} /> {roadmap.durationWeeks} weeks</span><span><Target size={15} /> {allMilestones.length} milestones</span><strong>{progress}% complete</strong></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      {expanded && <div className="roadmap-phases">
        {roadmap.phases.map((phase, phaseIndex) => {
          const phaseDone = phase.milestones.filter(m => m.status === "completed").length;
          return (
            <section className="roadmap-phase" key={phase._id || phaseIndex}>
              <div className="phase-heading"><span className="phase-index">PHASE {String(phaseIndex + 1).padStart(2, "0")}</span><h4>{phase.title}</h4><small>{phaseDone}/{phase.milestones.length} done</small></div>
              <p className="phase-objective">{phase.objective}</p>
              <div className="milestone-list">
                {phase.milestones.map(milestone => (
                  <div className={`milestone ${milestone.status}`} key={milestone._id}>
                    <div className="milestone-check">{milestone.status === "completed" ? <Check size={15} /> : <span />}</div>
                    <div className="milestone-copy"><strong>{milestone.title}</strong><p>{milestone.description}</p><small><Clock3 size={12} /> About {milestone.estimatedHours} hours</small></div>
                    <select aria-label={`Update status for ${milestone.title}`} value={milestone.status} onChange={e => onStatusChange(roadmap._id, milestone._id, e.target.value)}>
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>}
    </article>
  );
}

export default function Roadmaps() {
  const location = useLocation();
  const [roadmaps, setRoadmaps] = useState([]);
  const [careerTitle, setCareerTitle] = useState(location.state?.careerTitle || "");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRoadmaps = useCallback(async () => {
    const response = await api.get("/roadmaps");
    setRoadmaps(response.data.roadmaps || []);
  }, []);

  useEffect(() => {
    loadRoadmaps().catch(err => setError(err.response?.data?.message || "Could not load roadmaps.")).finally(() => setLoading(false));
  }, [loadRoadmaps]);

  const generate = async event => {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!careerTitle.trim()) { setError("Enter a career title to build your roadmap."); return; }
    setGenerating(true);
    try {
      const response = await api.post("/roadmaps/generate", { careerTitle: careerTitle.trim() });
      setRoadmaps(current => [response.data.roadmap, ...current]);
      setSuccess("Your roadmap is ready. Start with the first milestone.");
    } catch (err) { setError(err.response?.data?.message || "Unable to generate roadmap."); }
    finally { setGenerating(false); }
  };

  const updateStatus = async (roadmapId, milestoneId, status) => {
    setError(""); setSuccess("");
    try {
      const response = await api.patch(`/roadmaps/${roadmapId}/milestones/${milestoneId}`, { status });
      setRoadmaps(current => current.map(item => item._id === roadmapId ? response.data.roadmap : item));
    } catch (err) { setError(err.response?.data?.message || "Could not update milestone."); }
  };

  const total = useMemo(() => roadmaps.reduce((acc, roadmap) => {
    const milestones = roadmap.phases.flatMap(phase => phase.milestones);
    return { done: acc.done + milestones.filter(item => item.status === "completed").length, count: acc.count + milestones.length };
  }, { done: 0, count: 0 }), [roadmaps]);

  return (
    <div className="page-stack">
      <div className="page-intro"><span className="eyebrow">TURN GOALS INTO ACTION</span><h2>My career roadmaps</h2><p>Generate a practical learning plan for a career direction, then track each milestone as you make progress.</p></div>
      <Notice>{error}</Notice><Notice type="success">{success}</Notice>
      <form className="roadmap-create" onSubmit={generate}>
        <div className="roadmap-create-copy"><div className="action-icon"><Sparkles size={20} /></div><div><h3>Create a personalized roadmap</h3><p>Choose a target role. AI will build phases, tasks and realistic time estimates from your assessment.</p></div></div>
        <div className="roadmap-create-controls"><input value={careerTitle} onChange={e => setCareerTitle(e.target.value)} placeholder="e.g. Frontend Developer" maxLength={120} required /><button className="primary-button" disabled={generating}>{generating ? "Building plan..." : "Generate roadmap"} {generating ? <RefreshCw className="spin" size={16} /> : <Sparkles size={16} />}</button></div>
      </form>
      <div className="roadmap-summary-row"><div><span className="eyebrow">YOUR TRACKING</span><h3>Progress overview</h3></div><div className="roadmap-summary-stat"><strong>{total.done}/{total.count}</strong><span>milestones completed</span></div></div>
      {loading ? <div className="page-loading">Loading your roadmaps...</div> : roadmaps.length ? <div className="page-stack">{roadmaps.map(roadmap => <RoadmapCard key={roadmap._id} roadmap={roadmap} onStatusChange={updateStatus} />)}</div> : <div className="empty-state"><div className="empty-icon"><Target size={30} /></div><h3>Your plan starts with a target role.</h3><p>Enter a career title above to generate your first personalized roadmap.</p></div>}
    </div>
  );
}
