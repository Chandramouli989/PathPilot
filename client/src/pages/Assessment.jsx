import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import api from "../api/axios";
import Notice from "../components/Notice";

const emptyForm = { education: "", skills: "", interests: "", strengths: "", preferredWorkStyle: "No Preference", careerGoal: "" };
const toText = value => Array.isArray(value) ? value.join(", ") : (value || "");
const toList = value => value.split(",").map(item => item.trim()).filter(Boolean);

export default function Assessment() {
  const [form, setForm] = useState(emptyForm);
  const [exists, setExists] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalize = data => ({
    education: data.education || "",
    skills: toText(data.skills),
    interests: toText(data.interests),
    strengths: toText(data.strengths),
    preferredWorkStyle: data.preferredWorkStyle || "No Preference",
    careerGoal: data.careerGoal || "",
  });

  useEffect(() => {
    api.get("/assessments").then(res => {
      const data = res.data.assessment || res.data.data;
      if (data) { const mapped = normalize(data); setForm(mapped); setBaseline(JSON.stringify(mapped)); setExists(true); }
    }).catch(err => { if (err.response?.status !== 404) setError(err.response?.data?.message || "Unable to load assessment."); })
      .finally(() => setLoading(false));
  }, []);

  const change = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setError(""); setSuccess("");
    const current = JSON.stringify(form);
    if (exists && current === baseline) { setSuccess("No changes detected. Your assessment is already up to date."); return; }
    setBusy(true);
    const payload = { ...form, skills: toList(form.skills), interests: toList(form.interests), strengths: toList(form.strengths) };
    try {
      const response = exists ? await api.patch("/assessments", payload) : await api.post("/assessments", payload);
      const saved = response.data.assessment || response.data.data || payload;
      const mapped = normalize(saved);
      setForm(mapped); setBaseline(JSON.stringify(mapped)); setExists(true);
      setSuccess("Your career assessment has been saved successfully.");
    } catch (err) { setError(err.response?.data?.message || "Could not save your assessment. Please check the fields."); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="page-loading">Loading assessment...</div>;
  return (
    <div className="page-stack narrow-page">
      <div className="page-intro"><span className="eyebrow">KNOW YOURSELF</span><h2>Career assessment</h2><p>Give us a clear picture of where you are and where you want to go. Separate multiple skills or interests with commas.</p></div>
      <Notice>{error}</Notice><Notice type="success">{success}</Notice>
      <form className="content-card form-card" onSubmit={submit}>
        <div className="form-section"><h3>01. Your background</h3><label>Current education<input name="education" required placeholder="e.g. B.Tech in Information Technology" value={form.education} onChange={change} /></label></div>
        <div className="form-section"><h3>02. Your capabilities</h3><label>Skills<input name="skills" required placeholder="e.g. C++, React, JavaScript, SQL" value={form.skills} onChange={change} /></label><label>Strengths<input name="strengths" placeholder="e.g. Problem solving, communication, teamwork" value={form.strengths} onChange={change} /></label></div>
        <div className="form-section"><h3>03. Your interests</h3><label>Areas you enjoy<input name="interests" required placeholder="e.g. Web development, AI, data analytics" value={form.interests} onChange={change} /></label><label>Preferred work style<select name="preferredWorkStyle" value={form.preferredWorkStyle} onChange={change}><option>No Preference</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label></div>
        <div className="form-section"><h3>04. Your direction</h3><label>Career goal<textarea name="careerGoal" required rows="3" placeholder="What kind of role or career would you like to pursue?" value={form.careerGoal} onChange={change} /></label></div>
        <button className="primary-button" disabled={busy}>{busy ? "Saving..." : exists ? "Update assessment" : "Save assessment"} <Save size={17} /></button>
      </form>
    </div>
  );
}
