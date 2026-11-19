import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Notice from "../components/Notice";

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ education: "", skills: "", interests: "", careerGoal: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({
      education: user?.education || "",
      skills: Array.isArray(user?.skills) ? user.skills.join(", ") : user?.skills || "",
      interests: Array.isArray(user?.interests) ? user.interests.join(", ") : user?.interests || "",
      careerGoal: user?.careerGoal || "",
    });
  }, [user]);

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const payload = {
      education: form.education,
      skills: form.skills.split(",").map(v => v.trim()).filter(Boolean),
      interests: form.interests.split(",").map(v => v.trim()).filter(Boolean),
      careerGoal: form.careerGoal,
    };
    try {
      await api.patch("/users/profile", payload);
      await refreshProfile();
      setSuccess("Your profile has been updated.");
    } catch (err) { setError(err.response?.data?.message || "Unable to update your profile."); }
    finally { setBusy(false); }
  };

  return (
    <div className="page-stack narrow-page">
      <div className="page-intro"><span className="eyebrow">ACCOUNT DETAILS</span><h2>My profile</h2><p>Keep your background and career preferences up to date.</p></div>
      <div className="profile-heading"><div className="profile-avatar"><UserRound size={27} /></div><div><h3>{user?.name || "Your name"}</h3><p>{user?.email || ""}</p></div></div>
      <Notice>{error}</Notice><Notice type="success">{success}</Notice>
      <form className="content-card form-card" onSubmit={submit}>
        <div className="form-section"><h3>Personal information</h3><label>Full name<input value={user?.name || ""} disabled /></label><label>Email address<input value={user?.email || ""} disabled /></label></div>
        <div className="form-section"><h3>Career information</h3><label>Education<input name="education" placeholder="Your current education" value={form.education} onChange={change} /></label><label>Skills<input name="skills" placeholder="Separate skills with commas" value={form.skills} onChange={change} /></label><label>Interests<input name="interests" placeholder="Separate interests with commas" value={form.interests} onChange={change} /></label><label>Career goal<textarea name="careerGoal" rows="3" placeholder="Your career goal" value={form.careerGoal} onChange={change} /></label></div>
        <button className="primary-button" disabled={busy}>{busy ? "Saving..." : "Save changes"} <Save size={17} /></button>
      </form>
    </div>
  );
}
