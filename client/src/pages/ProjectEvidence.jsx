import { useEffect, useMemo, useState } from "react";
import { Code2, ExternalLink, Plus, Pencil, Trash2, X, CheckCircle2, FolderKanban } from "lucide-react";
import api from "../api/axios";

const EMPTY_FORM = {
  projectName: "", description: "", skillsText: "", repositoryUrl: "", liveUrl: "",
  evidenceType: "Personal project", status: "In progress"
};

function normalize(item) {
  return {
    ...item,
    skillsText: Array.isArray(item.skills) ? item.skills.join(", ") : ""
  };
}

export default function ProjectEvidence() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadEvidence = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/project-evidence");
      setItems(response.data.evidence || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your project evidence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvidence(); }, []);

  const completedCount = useMemo(() => items.filter(item => item.status === "Completed").length, [items]);
  const linkedCount = useMemo(() => items.filter(item => item.repositoryUrl || item.liveUrl).length, [items]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEdit = item => {
    setEditingId(item._id);
    setForm(normalize(item));
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      projectName: form.projectName,
      description: form.description,
      skills: form.skillsText.split(",").map(value => value.trim()).filter(Boolean),
      repositoryUrl: form.repositoryUrl,
      liveUrl: form.liveUrl,
      evidenceType: form.evidenceType,
      status: form.status
    };
    try {
      if (editingId) await api.patch(`/project-evidence/${editingId}`, payload);
      else await api.post("/project-evidence", payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setNotice(editingId ? "Project evidence updated." : "Project evidence added.");
      await loadEvidence();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save this project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async id => {
    if (!window.confirm("Delete this project evidence entry?")) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/project-evidence/${id}`);
      setItems(current => current.filter(item => item._id !== id));
      setNotice("Project evidence deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this entry.");
    }
  };

  return (
    <div className="evidence-page">
      <section className="evidence-hero">
        <div>
          <span className="eyebrow">SHOW WHAT YOU CAN BUILD</span>
          <h2>Turn projects into skill evidence.</h2>
          <p>Record the projects where you have applied your skills. Add repository and live-demo links so your learning has something tangible behind it.</p>
        </div>
        <button className="evidence-primary" onClick={openNew}><Plus size={17} /> Add project</button>
      </section>

      <section className="evidence-stats">
        <div><span>Projects recorded</span><strong>{items.length}</strong></div>
        <div><span>Completed projects</span><strong>{completedCount}</strong></div>
        <div><span>With public links</span><strong>{linkedCount}</strong></div>
      </section>

      {error && <div className="evidence-alert">{error}</div>}
      {notice && <div className="evidence-notice">{notice}</div>}

      {showForm && <section className="evidence-form-card">
        <div className="evidence-form-heading">
          <div><h3>{editingId ? "Edit project evidence" : "Add a project"}</h3><p>Describe your contribution and link the work where possible.</p></div>
          <button className="evidence-icon-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18} /></button>
        </div>
        <form onSubmit={save} className="evidence-form">
          <label>Project name<input required maxLength="100" value={form.projectName} onChange={e => setForm({...form, projectName:e.target.value})} placeholder="e.g. MovieHub — movie discovery app" /></label>
          <label>What did you build?<textarea required maxLength="1200" rows="4" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Explain the problem, key features, your contribution and technical decisions." /></label>
          <label>Skills used <span className="evidence-hint">(comma-separated)</span><input value={form.skillsText} onChange={e => setForm({...form, skillsText:e.target.value})} placeholder="React, JavaScript, Redux Toolkit, REST API" /></label>
          <div className="evidence-form-row">
            <label>Repository URL<input type="url" value={form.repositoryUrl} onChange={e => setForm({...form, repositoryUrl:e.target.value})} placeholder="https://github.com/..." /></label>
            <label>Live demo URL<input type="url" value={form.liveUrl} onChange={e => setForm({...form, liveUrl:e.target.value})} placeholder="https://..." /></label>
          </div>
          <div className="evidence-form-row">
            <label>Evidence type<select value={form.evidenceType} onChange={e => setForm({...form, evidenceType:e.target.value})}>{["Personal project","Academic project","Internship","Open source","Other"].map(v=><option key={v}>{v}</option>)}</select></label>
            <label>Project status<select value={form.status} onChange={e => setForm({...form, status:e.target.value})}><option>In progress</option><option>Completed</option></select></label>
          </div>
          <div className="evidence-form-actions">
            <button type="button" className="evidence-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="evidence-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Save project"}</button>
          </div>
        </form>
      </section>}

      {loading ? <div className="evidence-empty">Loading your project evidence...</div> :
        items.length === 0 ? <div className="evidence-empty"><FolderKanban size={34}/><h3>Your project evidence starts here</h3><p>Add a project, describe the skills you used and attach a GitHub or live-demo link.</p><button className="evidence-primary" onClick={openNew}><Plus size={16}/> Add your first project</button></div> :
        <section className="evidence-list">
          {items.map(item => <article className="evidence-card" key={item._id}>
            <div className="evidence-card-top">
              <div className="evidence-card-icon"><Code2 size={20}/></div>
              <div className="evidence-card-title"><h3>{item.projectName}</h3><span>{item.evidenceType} · {item.status}</span></div>
              <div className="evidence-card-actions">
                <button onClick={() => openEdit(item)} aria-label="Edit project"><Pencil size={16}/></button>
                <button onClick={() => remove(item._id)} aria-label="Delete project"><Trash2 size={16}/></button>
              </div>
            </div>
            <p className="evidence-description">{item.description}</p>
            {item.skills?.length > 0 && <div className="evidence-tags">{item.skills.map(skill=><span key={skill}>{skill}</span>)}</div>}
            <div className="evidence-links">
              {item.repositoryUrl && <a href={item.repositoryUrl} target="_blank" rel="noreferrer">Repository <ExternalLink size={13}/></a>}
              {item.liveUrl && <a href={item.liveUrl} target="_blank" rel="noreferrer">Live demo <ExternalLink size={13}/></a>}
              {item.status === "Completed" && <span className="evidence-complete"><CheckCircle2 size={14}/> Completed</span>}
            </div>
          </article>)}
        </section>
      }
      <p className="evidence-disclaimer">PathPilot stores the project details and links you submit. Adding a project does not independently verify its ownership, code quality or skill level. Use accurate descriptions and link work you are authorized to share.</p>
    </div>
  );
}
