import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowUpRight, Award, CheckCircle2,
  Clock3, Flame, Target, TrendingUp
} from "lucide-react";
import api from "../api/axios";
import Notice from "../components/Notice";

function getMilestones(roadmaps) {
  return roadmaps.flatMap(roadmap =>
    (roadmap.phases || []).flatMap((phase, phaseIndex) =>
      (phase.milestones || []).map(milestone => ({
        ...milestone,
        phaseTitle: phase.title,
        phaseIndex,
        careerTitle: roadmap.careerTitle,
        roadmapId: roadmap._id
      }))
    )
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "violet" }) {
  return (
    <article className="progress-metric">
      <div className={`progress-metric-icon ${tone}`}><Icon size={19} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export default function Progress() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/roadmaps")
      .then(response => setRoadmaps(response.data.roadmaps || []))
      .catch(err => setError(err.response?.data?.message || "Could not load your progress data."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const milestones = getMilestones(roadmaps);
    const completed = milestones.filter(item => item.status === "completed");
    const inProgress = milestones.filter(item => item.status === "in_progress");
    const hours = completed.reduce((sum, item) => sum + (Number(item.estimatedHours) || 0), 0);
    const percent = milestones.length ? Math.round(completed.length / milestones.length * 100) : 0;
    const phases = roadmaps.flatMap(roadmap => (roadmap.phases || []).map((phase, index) => {
      const total = (phase.milestones || []).length;
      const done = (phase.milestones || []).filter(item => item.status === "completed").length;
      return { title: phase.title, careerTitle: roadmap.careerTitle, total, done, percent: total ? Math.round(done / total * 100) : 0, key: `${roadmap._id}-${index}` };
    }));
    const recent = completed
      .filter(item => item.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);
    return { milestones, completed, inProgress, hours, percent, phases, recent };
  }, [roadmaps]);

  if (loading) return <div className="page-loading">Calculating your career progress...</div>;

  return (
    <div className="page-stack">
      <div className="page-intro progress-intro">
        <div><span className="eyebrow">MEASURE YOUR MOMENTUM</span><h2>Career progress</h2><p>A clear view of the work you've completed and the milestones still ahead.</p></div>
        <Link className="secondary-button" to="/roadmaps">Open roadmaps <ArrowUpRight size={16} /></Link>
      </div>
      <Notice>{error}</Notice>

      {roadmaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Target size={30} /></div>
          <h3>Your progress story starts with a roadmap.</h3>
          <p>Create a career roadmap to see milestone completion, learning effort and phase-by-phase progress here.</p>
          <Link className="primary-button" to="/roadmaps">Create my first roadmap <ArrowUpRight size={16} /></Link>
        </div>
      ) : (
        <>
          <section className="progress-metrics-grid">
            <MetricCard icon={CheckCircle2} label="Completed milestones" value={`${stats.completed.length}/${stats.milestones.length}`} detail="Across all your roadmaps" tone="green" />
            <MetricCard icon={TrendingUp} label="Overall completion" value={`${stats.percent}%`} detail="Based on completed milestones" tone="violet" />
            <MetricCard icon={Activity} label="Currently in progress" value={stats.inProgress.length} detail="Milestones you've started" tone="amber" />
            <MetricCard icon={Clock3} label="Learning hours completed" value={`${stats.hours}h`} detail="Estimated hours for completed tasks" tone="blue" />
          </section>

          <section className="progress-panel">
            <div className="progress-panel-heading"><div><span className="eyebrow">ROADMAP BREAKDOWN</span><h3>Progress by learning phase</h3></div><span className="progress-panel-badge">{stats.phases.length} phases</span></div>
            <div className="phase-progress-list">
              {stats.phases.map(phase => (
                <div className="phase-progress-item" key={phase.key}>
                  <div className="phase-progress-copy"><div><strong>{phase.title}</strong><small>{phase.careerTitle}</small></div><b>{phase.percent}%</b></div>
                  <div className="progress-track"><span style={{ width: `${phase.percent}%` }} /></div>
                  <small className="phase-progress-count">{phase.done} of {phase.total} milestones completed</small>
                </div>
              ))}
            </div>
          </section>

          <div className="progress-lower-grid">
            <section className="progress-panel">
              <div className="progress-panel-heading"><div><span className="eyebrow">RECENT WINS</span><h3>Completed milestones</h3></div><Award size={20} /></div>
              {stats.recent.length ? (
                <div className="recent-win-list">
                  {stats.recent.map((item, index) => (
                    <div className="recent-win" key={item._id || `${item.title}-${index}`}>
                      <span className="recent-win-check"><CheckCircle2 size={16} /></span>
                      <div><strong>{item.title}</strong><small>{item.careerTitle} · {new Date(item.completedAt).toLocaleDateString()}</small></div>
                    </div>
                  ))}
                </div>
              ) : <p className="progress-empty-note">Completed milestones will appear here when their completion date is available.</p>}
            </section>
            <section className="progress-panel progress-tip-panel">
              <div className="progress-panel-heading"><div><span className="eyebrow">YOUR NEXT STEP</span><h3>Keep the momentum</h3></div><Flame size={20} /></div>
              <p>{stats.inProgress.length ? `You have ${stats.inProgress.length} milestone${stats.inProgress.length === 1 ? "" : "s"} in progress. Finish one before adding too many new tasks.` : "Choose one not-started milestone and move it into progress. A small, consistent step is better than waiting for the perfect time."}</p>
              <Link className="text-link" to="/roadmaps">Continue learning <ArrowUpRight size={16} /></Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
