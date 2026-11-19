import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Notice from "../components/Notice";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setBusy(true);
    try { await login(form); navigate("/dashboard", { replace: true }); }
    catch (err) { setError(err.response?.data?.message || "Unable to sign in. Check your details and try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="brand brand-light"><span className="brand-icon"><BrainCircuit size={22} /></span><span>PathPilot</span></div>
        <div className="auth-visual-copy"><span className="pill">A clearer path starts here</span><h1>Turn your potential into a plan.</h1><p>Discover career directions that connect your interests, strengths and skills.</p></div>
        <div className="visual-footnote">Explore. Understand. Grow.</div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-card" onSubmit={submit}>
          <span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account</h2><p className="muted">Continue building a career that fits you.</p>
          <Notice>{error}</Notice>
          <label>Email address<input type="email" required autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input type="password" required autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <button className="primary-button full-button" disabled={busy}>{busy ? "Signing in..." : "Sign in"} <ArrowRight size={17} /></button>
          <p className="auth-switch">New to PathPilot? <Link to="/register">Create an account</Link></p>
        </form>
      </section>
    </div>
  );
}
