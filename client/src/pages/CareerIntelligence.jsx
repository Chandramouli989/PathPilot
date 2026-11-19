import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BadgeCheck, BookOpen, Circle, Clock3, Target, TrendingUp, FolderCheck } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Notice from "../components/Notice";

// A transparent starter catalogue. This is deliberately rule-based, not AI-invented.
const CAREER_SKILLS = {
  "frontend developer": [
    ["HTML & CSS", ["html", "css", "tailwind", "bootstrap"]],
    ["JavaScript", ["javascript", "js", "es6"]],
    ["React", ["react", "reactjs", "react.js"]],
    ["Responsive design", ["responsive design", "responsive ui"]],
    ["Git & GitHub", ["git", "github", "version control"]],
    ["REST APIs", ["rest api", "rest apis", "api", "axios", "fetch"]],
    ["Testing & debugging", ["testing", "debugging", "jest", "vitest"]]
  ],
  "full stack developer": [
    ["HTML, CSS & JavaScript", ["html", "css", "javascript", "js"]],
    ["React", ["react", "reactjs", "react.js"]],
    ["Node.js", ["node", "node.js", "nodejs"]],
    ["Express", ["express", "express.js"]],
    ["Database fundamentals", ["mongodb", "mysql", "postgresql", "database", "sql"]],
    ["REST APIs", ["rest api", "rest apis", "api", "axios", "fetch"]],
    ["Git & GitHub", ["git", "github", "version control"]],
    ["Testing & deployment", ["testing", "deployment", "vercel", "render", "jest"]]
  ],
  "backend developer": [
    ["Programming fundamentals", ["c++", "java", "python", "javascript", "programming"]],
    ["Node.js or backend runtime", ["node", "node.js", "nodejs", "java", "python"]],
    ["API development", ["rest api", "rest apis", "express", "api"]],
    ["Databases", ["mongodb", "mysql", "postgresql", "sql", "database"]],
    ["Authentication", ["jwt", "authentication", "authorization", "bcrypt"]],
    ["Git & GitHub", ["git", "github", "version control"]],
    ["Testing & debugging", ["testing", "debugging", "jest", "postman"]]
  ],
  "data analyst": [
    ["Excel or spreadsheets", ["excel", "spreadsheets", "google sheets"]],
    ["SQL", ["sql", "mysql", "postgresql"]],
    ["Python", ["python", "pandas", "numpy"]],
    ["Data visualization", ["power bi", "tableau", "data visualization"]],
    ["Statistics", ["statistics", "probability", "statistical analysis"]],
    ["Data storytelling", ["data storytelling", "reporting", "dashboard"]]
  ],
  "software engineer": [
    ["Programming fundamentals", ["c++", "java", "python", "javascript", "programming"]],
    ["Data structures & algorithms", ["dsa", "data structures", "algorithms"]],
    ["Object-oriented programming", ["oops", "object oriented", "oop"]],
    ["Databases", ["mongodb", "mysql", "postgresql", "sql", "database"]],
    ["API fundamentals", ["rest api", "rest apis", "api"]],
    ["Git & GitHub", ["git", "github", "version control"]],
    ["Testing & debugging", ["testing", "debugging"]]
  ]
};

const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9.+# ]/g, " ").replace(/\s+/g, " ").trim();
const includesAny = (haystack, terms) => terms.some(term => haystack.includes(normalize(term)));

function getSkillDefinitions(careerTitle) {
  const title = normalize(careerTitle);
  const match = Object.entries(CAREER_SKILLS).find(([key]) => title.includes(key) || key.includes(title));
  return match?.[1] || [
    ["Core programming", ["programming", "javascript", "python", "java", "c++"]],
    ["Role-specific tools", [title.split(" ")[0] || "tools"]],
    ["Problem solving", ["problem solving", "dsa", "algorithms"]],
    ["Projects & practical experience", ["project", "portfolio"]],
    ["Git & collaboration", ["git", "github", "collaboration"]],
    ["Communication", ["communication", "teamwork"]]
  ];
}

function getAssessmentResult(skillName, skillAliases, latestResults) {
  const accepted = [skillName, ...(skillAliases || [])].map(normalize).filter(Boolean);
  return (latestResults || []).find(result => {
    const checkedSkill = normalize(result.skill);
    if (!checkedSkill) return false;
    // Match both exact catalogue labels and component skills. For example,
    // a JavaScript check must match "HTML, CSS & JavaScript".
    return accepted.some(alias =>
      alias === checkedSkill ||
      alias.includes(checkedSkill) ||
      checkedSkill.includes(alias)
    );
  }) || null;
}

function classifySkills(definitions, assessment, roadmaps, projectEvidence, latestResults) {
  const profileSkills = (assessment?.skills || []).map(normalize);
  const allMilestones = (roadmaps || []).flatMap(roadmap =>
    (roadmap.phases || []).flatMap(phase =>
      (phase.milestones || []).map(item => ({
        text: normalize(`${item.title} ${item.description}`),
        status: item.status
      }))
    )
  );

  return definitions.map(([name, aliases]) => {
    const linkedProjects = (projectEvidence || []).filter(project =>
      (project.skills || []).some(skill => includesAny(normalize(skill), aliases) || aliases.some(alias => normalize(alias).includes(normalize(skill)) && normalize(skill).length > 2))
    );
    const selfReported = profileSkills.some(skill => includesAny(skill, aliases) || aliases.some(alias => normalize(alias).includes(skill) && skill.length > 2));
    const relatedMilestones = allMilestones.filter(item => includesAny(item.text, aliases));
    const completed = relatedMilestones.some(item => item.status === "completed");
    const practicing = relatedMilestones.some(item => item.status === "in_progress");
    const status = linkedProjects.length ? "project-linked" : selfReported || completed ? "have" : practicing ? "practicing" : "missing";
    const evidence = linkedProjects.length
      ? `Listed in ${linkedProjects.length} project${linkedProjects.length === 1 ? "" : "s"}: ${linkedProjects.map(project => project.projectName).slice(0, 2).join(", ")}`
      : selfReported ? "Listed in your assessment"
      : completed ? "Related roadmap milestone completed"
      : practicing ? "Related roadmap milestone in progress"
      : "Not yet found in your profile, roadmap or projects";
    const assessmentResult = getAssessmentResult(name, aliases, latestResults);
    return { name, status, evidence, linkedProjects, assessmentResult };
  });
}

export default function CareerIntelligence() {
  const [assessment, setAssessment] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [projectEvidence, setProjectEvidence] = useState([]);
  const [latestResults, setLatestResults] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/assessments"),
      api.get("/roadmaps"),
      api.get("/project-evidence"),
      api.get("/skill-checks/results")
    ])
      .then(([assessmentResponse, roadmapResponse, evidenceResponse, skillCheckResponse]) => {
        setAssessment(assessmentResponse.data.assessment || null);
        const items = roadmapResponse.data.roadmaps || [];
        setRoadmaps(items);
        setProjectEvidence(evidenceResponse.data.evidence || []);
        setLatestResults(skillCheckResponse.data.latestResults || []);
        if (items.length) setSelectedRoadmap(items[0]._id);
      })
      .catch(err => setError(err.response?.data?.message || "Unable to load career intelligence. Please check your assessment and roadmap."))
      .finally(() => setLoading(false));
  }, []);

  const activeRoadmap = roadmaps.find(item => item._id === selectedRoadmap) || roadmaps[0];
  const careerTitle = activeRoadmap?.careerTitle || assessment?.careerGoal || "";
  const skills = useMemo(() => classifySkills(getSkillDefinitions(careerTitle), assessment, roadmaps, projectEvidence, latestResults), [careerTitle, assessment, roadmaps, projectEvidence, latestResults]);
  const readiness = skills.length ? Math.round(skills.reduce((sum, item) => {
    if (item.assessmentResult?.passed) return sum + 1;
    if (item.assessmentResult && !item.assessmentResult.passed) return sum + 0.2;
    return sum + (item.status === "project-linked" ? 0.85 : item.status === "have" ? 0.65 : item.status === "practicing" ? 0.3 : 0);
  }, 0) / skills.length * 100) : 0;
  const counts = {
    projectLinked: skills.filter(item => item.status === "project-linked").length,
    have: skills.filter(item => item.status === "have").length,
    practicing: skills.filter(item => item.status === "practicing").length,
    missing: skills.filter(item => item.status === "missing").length,
    assessed: skills.filter(item => item.assessmentResult).length,
    passed: skills.filter(item => item.assessmentResult?.passed).length,
    needsPractice: skills.filter(item => item.assessmentResult && !item.assessmentResult.passed).length
  };
  const nextSkills = skills.filter(item => item.status !== "project-linked").slice(0, 3);

  if (loading) return <div className="page-loading">Analyzing your career profile...</div>;

  return (
    <div className="page-stack">
      <div className="page-intro">
        <div><span className="eyebrow">UNDERSTAND YOUR NEXT MOVE</span><h2>Career intelligence</h2><p>See how your current profile and roadmap activity align with your target career.</p></div>
        <Link className="secondary-button" to="/assessment">Update assessment <ArrowUpRight size={16} /></Link>
      </div>
      {error && <Notice>{error}</Notice>}
      {!assessment ? (
        <div className="empty-state"><div className="empty-icon"><BookOpen size={28} /></div><h3>Complete your career assessment first</h3><p>Your assessment gives PathPilot the starting information it needs to compare your skills with a career target.</p><Link className="primary-button" to="/assessment">Complete assessment</Link></div>
      ) : (
        <>
          {roadmaps.length > 0 && <div className="intelligence-select-row"><label htmlFor="intelligence-roadmap">Career target</label><select id="intelligence-roadmap" value={activeRoadmap?._id || ""} onChange={event => setSelectedRoadmap(event.target.value)}>{roadmaps.map(item => <option key={item._id} value={item._id}>{item.careerTitle}</option>)}</select></div>}
          {!careerTitle && <Notice>Please add a career goal in your assessment or create a roadmap to analyze a target role.</Notice>}
          <section className="readiness-hero">
            <div className="readiness-copy"><span className="eyebrow">ESTIMATED SKILL ALIGNMENT</span><h3>{careerTitle || "Your target career"}</h3><p>This is a weighted learning indicator, not a hiring or proficiency score. A passed foundational check receives the strongest weight; a failed check signals a practice gap. Project details are user-submitted and not independently verified.</p><div className="readiness-legend"><span><i className="legend-dot have" /> {counts.passed} assessment passed</span><span><i className="legend-dot practicing" /> {counts.projectLinked} project-linked</span><span><i className="legend-dot missing" /> {counts.have} in profile · {counts.practicing} practicing · {counts.missing} to build</span></div></div>
            <div className="readiness-score"><div className="readiness-ring" style={{ "--readiness": `${readiness}%` }}><div><strong>{readiness}%</strong><small>alignment</small></div></div><span>Skill coverage estimate</span></div>
          </section>

          <section className="progress-panel">
            <div className="progress-panel-heading"><div><span className="eyebrow">SKILL GAP ANALYSIS</span><h3>Skills for this career</h3></div><Target size={20} /></div>
            <div className="skill-gap-list">{skills.map(skill => {
              const Icon = skill.status === "project-linked" ? FolderCheck : skill.status === "have" ? BadgeCheck : skill.status === "practicing" ? Clock3 : Circle;
              const label = skill.status === "project-linked" ? "Project-linked" : skill.status === "have" ? "In profile" : skill.status === "practicing" ? "Practicing" : "To learn";
              const result = skill.assessmentResult;
              return <article className={`skill-gap-item ${skill.status} ${result ? (result.passed ? "assessment-passed" : "assessment-failed") : ""}`} key={skill.name}>
                <span className="skill-gap-icon"><Icon size={18} /></span>
                <div className="skill-gap-copy"><strong>{skill.name}</strong><small>{skill.evidence}</small>
                  {result && <small className={`assessment-evidence ${result.passed ? "passed" : "failed"}`}>Skill check: {result.score}% · {result.passed ? "Passed" : "Needs practice"} · {new Date(result.createdAt).toLocaleDateString()}</small>}
                </div>
                <span className={`skill-status ${result ? (result.passed ? "assessment-passed" : "assessment-failed") : skill.status}`}>{result ? (result.passed ? "Assessment passed" : "Needs practice") : label}</span>
              </article>;
            })}</div>
          </section>

          <section className="progress-panel skill-check-coverage-panel">
            <div className="progress-panel-heading"><div><span className="eyebrow">KNOWLEDGE CHECKS</span><h3>Assessment-backed skills</h3></div><BadgeCheck size={20} /></div>
            <div className="evidence-coverage-summary">
              <strong>{counts.passed} passed · {counts.needsPractice} need practice</strong>
              <span>{counts.assessed} of {skills.length} matching career skills have a saved skill-check result.</span>
            </div>
            {counts.assessed ? <div className="skill-check-result-list">
              {skills.filter(skill => skill.assessmentResult).map(skill => <div className="skill-check-result-row" key={skill.name}>
                <span>{skill.name}</span><strong className={skill.assessmentResult.passed ? "passed" : "failed"}>{skill.assessmentResult.score}% · {skill.assessmentResult.passed ? "Passed" : "Needs practice"}</strong>
              </div>)}
            </div> : <p className="progress-empty-note">No skill-check results match this career's current skill catalogue yet. Take a JavaScript, React, Node.js, SQL or C++ check to add assessment evidence where relevant.</p>}
            <Link className="text-link" to="/skill-checks">Take or retake skill checks <ArrowUpRight size={16} /></Link>
            <p className="evidence-coverage-disclaimer">These are short foundational MCQs, not practical coding tests or certifications. Results show performance on PathPilot's question set only.</p>
          </section>

          <section className="progress-panel evidence-coverage-panel">
            <div className="progress-panel-heading"><div><span className="eyebrow">CONNECT LEARNING TO PRACTICE</span><h3>Project-linked skill evidence</h3></div><FolderCheck size={20} /></div>
            <div className="evidence-coverage-summary">
              <strong>{counts.projectLinked} of {skills.length} career skills</strong>
              <span>have been linked to at least one project you recorded.</span>
            </div>
            {projectEvidence.length ? <div className="evidence-project-chips">{projectEvidence.slice(0, 4).map(project => <span key={project._id}>{project.projectName}</span>)}</div> : <p className="progress-empty-note">You have not added any project evidence yet. Add projects and list the skills you used to connect practical work with your career target.</p>}
            <Link className="text-link" to="/project-evidence">Manage project evidence <ArrowUpRight size={16} /></Link>
            <p className="evidence-coverage-disclaimer">Project-linked means a skill was listed on a project record. PathPilot does not independently verify the repository, ownership or quality.</p>
          </section>

          <section className="progress-panel next-skills-panel">
            <div className="progress-panel-heading"><div><span className="eyebrow">RECOMMENDED FOCUS</span><h3>Your next skill priorities</h3></div><TrendingUp size={20} /></div>
            {nextSkills.length ? <div className="next-skill-cards">{nextSkills.map((skill, index) => <div className="next-skill-card" key={skill.name}><span>0{index + 1}</span><div><strong>{skill.name}</strong><small>{skill.status === "have" ? "Add a project where you used this skill, with a repository or demo link." : skill.status === "practicing" ? "Finish the related roadmap milestone and add a project that uses this skill." : "Start with the related roadmap phase, then record a practical project using this skill."}</small></div></div>)}</div> : <p className="progress-empty-note">All catalogue skills are currently linked to projects or present in your profile. Consider validating them with projects, quizzes or portfolio evidence.</p>}
            <div className="intelligence-action-links"><Link className="text-link" to="/roadmaps">Open learning roadmap <ArrowUpRight size={16} /></Link><Link className="text-link" to="/project-evidence">Add project evidence <ArrowUpRight size={16} /></Link></div>
          </section>
        </>
      )}
    </div>
  );
}
