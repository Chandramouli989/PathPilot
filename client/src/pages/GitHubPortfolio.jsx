import { useMemo, useState } from "react";
import { Code2, ExternalLink, Star, Globe, RefreshCw } from "lucide-react";
import api from "../api/axios";

const ROLE_SKILLS = {
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "UI", "frontend", "web"],
  "Full Stack Developer": ["React", "Node", "Express", "MongoDB", "API", "fullstack", "full-stack"],
  "Backend Developer": ["Node", "Express", "API", "database", "MongoDB", "backend", "server"],
  "Software Engineer": ["C++", "Java", "Python", "DSA", "algorithm", "system", "software"],
  "Data Analyst": ["Python", "SQL", "data", "analytics", "visualization", "pandas"]
};

export default function GitHubPortfolio() {
  const [username, setUsername] = useState("Chandramouli989");
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (event) => {
    event?.preventDefault();
    if (!username.trim()) {
      setError("Enter your GitHub username to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/github/analyze?username=${encodeURIComponent(username.trim())}`);
      setAnalysis(response.data.data);
    } catch (err) {
      setAnalysis(null);
      setError(err.response?.data?.message || "Could not analyze this GitHub profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roleSignals = useMemo(() => {
    if (!analysis) return [];
    const terms = ROLE_SKILLS[targetRole] || [];
    return analysis.repositories.map(repo => {
      const haystack = `${repo.name} ${repo.description || ""} ${repo.language || ""} ${(repo.topics || []).join(" ")}`.toLowerCase();
      const matches = terms.filter(term => haystack.includes(term.toLowerCase()));
      return { ...repo, matches };
    }).sort((a, b) => b.matches.length - a.matches.length);
  }, [analysis, targetRole]);

  const stats = analysis?.overview;
  const scoreStyle = { "--score": `${stats?.evidenceScore || 0}%` };

  return (
    <div className="github-page">
      <section className="github-hero">
        <div>
          <span className="eyebrow">PORTFOLIO EVIDENCE</span>
          <h2>Turn your GitHub into career evidence.</h2>
          <p>Review public project signals, identify documentation gaps and see which repositories appear relevant to your target role.</p>
          <form className="github-form" onSubmit={analyze}>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="GitHub username" aria-label="GitHub username" />
            <button type="submit" disabled={loading}>{loading ? "Analyzing..." : "Analyze profile"}</button>
          </form>
        </div>
        {analysis?.profile && <div className="github-profile">
          <img src={analysis.profile.avatarUrl} alt="" />
          <div><strong>{analysis.profile.name || analysis.profile.username}</strong><span>@{analysis.profile.username}</span><span>{analysis.profile.followers} followers</span></div>
        </div>}
      </section>

      {error && <div className="github-error">{error}</div>}

      {!analysis && !loading && !error && <div className="github-empty">
        <Code2 size={30} /><h3>Analyze a public GitHub profile</h3>
        <p>Enter a username above. PathPilot will inspect public repository metadata and return practical portfolio improvements.</p>
      </div>}

      {loading && <div className="github-empty"><RefreshCw size={24} /> Fetching public profile and repository details...</div>}

      {analysis && stats && <>
        <section className="github-stats">
          <div className="github-stat"><span>Original repositories</span><strong>{stats.originalRepos}</strong></div>
          <div className="github-stat"><span>Public stars</span><strong>{stats.totalStars}</strong></div>
          <div className="github-stat"><span>Repositories with README</span><strong>{stats.readmeCount}</strong></div>
          <div className="github-stat"><span>Recently updated</span><strong>{stats.recentlyUpdatedCount}</strong></div>
        </section>

        <div className="github-grid">
          <section className="github-panel">
            <h3>Portfolio evidence overview</h3>
            <div className="github-score-row">
              <div className="github-score" style={scoreStyle}><strong>{stats.evidenceScore}</strong></div>
              <div className="github-score-copy"><strong>Evidence completeness</strong><p>A transparent metadata checklist, not a rating of your coding ability.</p></div>
            </div>
            <div className="github-bars">
              {[
                ["README coverage", stats.readmeCount, Math.min(stats.originalRepos, 30)],
                ["Descriptions", stats.descriptionCount, stats.originalRepos],
                ["Repository topics", stats.topicCount, stats.originalRepos],
                ["Live demos", stats.liveDemoCount, stats.originalRepos]
              ].map(([label, value, total]) => <div className="github-bar-row" key={label}>
                <span>{label}</span><div className="github-bar-track"><span style={{ width: `${total ? Math.min(100, value / total * 100) : 0}%` }} /></div><strong>{value}/{total}</strong>
              </div>)}
            </div>
            <p className="github-note">{analysis.scoreNote}</p>
          </section>

          <section className="github-panel">
            <h3>Recommended improvements</h3>
            <ul className="github-improvements">{analysis.improvements.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>

        <div className="github-grid">
          <section className="github-panel">
            <h3>Language signals</h3>
            {analysis.languages.length ? <div className="github-bars">{analysis.languages.map(item => <div className="github-bar-row" key={item.name}>
              <span>{item.name}</span><div className="github-bar-track"><span style={{ width: `${item.count / Math.max(...analysis.languages.map(x => x.count)) * 100}%` }} /></div><strong>{item.count}</strong>
            </div>)}</div> : <p>No language data is available for the public repositories.</p>}
          </section>
          <section className="github-panel">
            <h3>Role relevance signals</h3>
            <label className="field-label" htmlFor="github-role">Target role</label>
            <select id="github-role" value={targetRole} onChange={e => setTargetRole(e.target.value)} className="form-input">
              {Object.keys(ROLE_SKILLS).map(role => <option key={role}>{role}</option>)}
            </select>
            <p className="github-note">Repository names, descriptions, topics and primary language are matched against broad role keywords. This is a discovery aid, not a skills assessment.</p>
            <div className="github-tags">{[...new Set(roleSignals.flatMap(repo => repo.matches))].slice(0, 10).map(term => <span key={term}>{term}</span>)}</div>
          </section>
        </div>

        <section className="github-panel">
          <h3>Repositories to review for {targetRole}</h3>
          <div className="github-repo-list">
            {roleSignals.slice(0, 8).map(repo => <article className="github-repo" key={repo.name}>
              <div className="github-repo-head">
                <a href={repo.htmlUrl} target="_blank" rel="noreferrer">{repo.name} <ExternalLink size={13} /></a>
                <span><Star size={13} /> {repo.stars}</span>
              </div>
              <p>{repo.description || "No repository description yet."}</p>
              <div className="github-tags">
                {repo.language && <span>{repo.language}</span>}
                {repo.matches.slice(0, 4).map(term => <span key={term}>{term}</span>)}
                {repo.homepage && <a href={repo.homepage} target="_blank" rel="noreferrer"><Globe size={12} /> Live demo</a>}
                {repo.topics.slice(0, 3).map(topic => <span key={topic}>{topic}</span>)}
              </div>
            </article>)}
            {!roleSignals.length && <p>No original public repositories were found for this profile.</p>}
          </div>
        </section>
        <p className="github-note">Data is retrieved from public GitHub profile and repository endpoints when you run the analysis. GitHub rate limits may apply. Private repositories and source-code quality are not evaluated.</p>
      </>}
    </div>
  );
}
