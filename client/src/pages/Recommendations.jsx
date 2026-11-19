import { useState } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, Map, RefreshCw, Sparkles, Wrench, ArrowUpRight } from "lucide-react";
import api from "../api/axios";
import Notice from "../components/Notice";

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true); setError("");
    try {
      const response = await api.get("/ai/career-recommendations");
      setData(response.data.data || response.data.recommendations || response.data);
    } catch (err) { setError(err.response?.data?.message || "Unable to generate recommendations. Complete your assessment first."); }
    finally { setBusy(false); }
  };

  return (
    <div className="page-stack">
      <div className="page-intro recommendations-intro"><div><span className="eyebrow">AI-POWERED INSIGHTS</span><h2>Career recommendations</h2><p>Explore career paths informed by your assessment, with skills to improve and a project idea to get started.</p></div><button className="primary-button" onClick={generate} disabled={busy}>{busy ? "Generating..." : data ? "Refresh insights" : "Generate recommendations"} {busy ? <RefreshCw className="spin" size={17} /> : <Sparkles size={17} />}</button></div>
      <Notice>{error}</Notice>
      {!data && !busy && <div className="empty-state"><div className="empty-icon"><Sparkles size={30} /></div><h3>Your next opportunity starts with an insight.</h3><p>Save your career assessment, then generate recommendations to see three career directions that may suit you.</p><button className="secondary-button" onClick={generate}>Generate my insights <Sparkles size={16} /></button></div>}
      {busy && <div className="empty-state"><div className="loader-ring" /><h3>Thinking through your possibilities...</h3><p>Your recommendations are being prepared.</p></div>}
      {data && !busy && <>
        {data.summary && <section className="summary-card"><span className="pill pill-light">YOUR CAREER SNAPSHOT</span><p>{data.summary}</p></section>}
        <div className="section-heading"><div><span className="eyebrow">POTENTIAL DIRECTIONS</span><h2>Career paths to explore</h2></div><span className="result-count">{data.recommendations?.length || 0} suggestions</span></div>
        <div className="recommendation-grid">
          {(data.recommendations || []).map((career, index) => (
            <article className="career-card" key={`${career.title}-${index}`}>
              <div className="career-card-top"><span className="career-number">0{index + 1}</span><span className="career-tag">Career path</span></div>
              <h3>{career.title}</h3><p className="career-reason">{career.reason}</p>
              <div className="career-detail"><h4><Wrench size={16} /> Skills to improve</h4><div className="skill-tags">{(career.skillsToImprove || []).map(skill => <span key={skill}>{skill}</span>)}</div></div>
              <div className="career-detail project-detail"><h4><Lightbulb size={16} /> Project to try</h4><p>{career.projectIdea}</p></div>
              <Link className="text-link" to="/roadmaps" state={{ careerTitle: career.title }}>Build a roadmap <Map size={15} /><ArrowUpRight size={15} /></Link>
            </article>
          ))}
        </div>
      </>}
    </div>
  );
}
