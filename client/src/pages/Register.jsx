import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Notice from "../components/Notice";

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await register(form);
      if (!localStorage.getItem("token")) await login({ email: form.email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) { setError(err.response?.data?.message || "Unable to create your account. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="brand brand-light"><span className="brand-icon"><BrainCircuit size={22} /></span><span>PathPilot</span></div>
        <div className="auth-visual-copy"><span className="pill">Your next chapter</span><h1>Build a future around what makes you, you.</h1><p>A little clarity today can make a big difference to the choices you make tomorrow.</p></div>
        <div className="visual-footnote">Explore. Understand. Grow.</div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={submit}>
          <span className="eyebrow">GET STARTED</span><h2>Create your account</h2><p className="muted">Set up your personal career workspace.</p>
          <Notice>{error}</Notice>
          <label>Full name<input required autoComplete="name" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="primary-button full-button" disabled={busy}>{busy ? "Creating account..." : "Create account"} <ArrowRight size={17} /></button>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}
