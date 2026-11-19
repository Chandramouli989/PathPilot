import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness, Plus, Pencil, Trash2, ExternalLink, X,
  CalendarClock, Search, Filter, CheckCircle2, Clock3, Send,
  MessageSquareText, Trophy
} from "lucide-react";
import api from "../api/axios";

const STATUSES = ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected"];
const TYPES = ["Full-time", "Internship", "Contract", "Part-time", "Other"];
const EMPTY = {
  company: "", role: "", sourceUrl: "", location: "",
  opportunityType: "Full-time", status: "Saved",
  dateApplied: "", followUpDate: "", notes: ""
};

const dateInput = value => value ? new Date(value).toISOString().slice(0, 10) : "";
const prettyDate = value => value
  ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
  : "—";

function toForm(item) {
  return {
    company: item.company || "",
    role: item.role || "",
    sourceUrl: item.sourceUrl || "",
    location: item.location || "",
    opportunityType: item.opportunityType || "Full-time",
    status: item.status || "Saved",
    dateApplied: dateInput(item.dateApplied),
    followUpDate: dateInput(item.followUpDate),
    notes: item.notes || ""
  };
}

function isDue(item) {
  if (!item.followUpDate || ["Offer", "Rejected"].includes(item.status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(item.followUpDate);
  due.setHours(0, 0, 0, 0);
  return due <= today;
}

export default function ApplicationTracker() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/applications");
      setItems(response.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const dueItems = useMemo(() => items.filter(isDue), [items]);
  const counts = useMemo(() => ({
    total: items.length,
    applied: items.filter(item => ["Applied", "Assessment", "Interview", "Offer", "Rejected"].includes(item.status)).length,
    interviews: items.filter(item => item.status === "Interview").length,
    offers: items.filter(item => item.status === "Offer").length
  }), [items]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesStatus = filter === "All" || item.status === filter;
      const matchesSearch = !term || [item.company, item.role, item.location, item.notes]
        .some(value => String(value || "").toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, filter]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEdit = item => {
    setEditingId(item._id);
    setForm(toForm(item));
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
      ...form,
      dateApplied: form.dateApplied || null,
      followUpDate: form.followUpDate || null
    };
    try {
      if (editingId) await api.patch(`/applications/${editingId}`, payload);
      else await api.post("/applications", payload);
      setShowForm(false);
      setForm(EMPTY);
      setEditingId(null);
      setNotice(editingId ? "Application updated." : "Opportunity added to your tracker.");
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save this application. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async id => {
    if (!window.confirm("Delete this application from your tracker?")) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/applications/${id}`);
      setItems(current => current.filter(item => item._id !== id));
      setNotice("Application removed from your tracker.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this application.");
    }
  };

  const updateStatus = async (item, status) => {
    try {
      await api.patch(`/applications/${item._id}`, { ...toForm(item), status });
      setItems(current => current.map(entry => entry._id === item._id ? { ...entry, status } : entry));
      setNotice(`${item.company}: status changed to ${status}.`);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update application status.");
    }
  };

  return (
    <div className="application-page">
      <section className="application-hero">
        <div>
          <span className="eyebrow">KEEP YOUR SEARCH ORGANIZED</span>
          <h2>Every opportunity, one clear next step.</h2>
          <p>Save roles you find, track each application stage and set follow-up dates. Add opportunities manually from your job searches—PathPilot does not import or verify vacancies.</p>
        </div>
        <button className="application-primary" onClick={openNew}><Plus size={17} /> Add opportunity</button>
      </section>

      <section className="application-stats">
        <div><span>Total tracked</span><strong>{counts.total}</strong><small>Saved opportunities</small></div>
        <div><span>Applications started</span><strong>{counts.applied}</strong><small>Applied or further along</small></div>
        <div><span>Interviews</span><strong>{counts.interviews}</strong><small>Interview stage</small></div>
        <div><span>Offers</span><strong>{counts.offers}</strong><small>Offer stage</small></div>
      </section>

      {error && <div className="application-alert">{error}</div>}
      {notice && <div className="application-notice">{notice}</div>}

      {dueItems.length > 0 && (
        <section className="application-followups">
          <div className="application-followup-icon"><CalendarClock size={19} /></div>
          <div><strong>{dueItems.length} follow-up{dueItems.length > 1 ? "s" : ""} due</strong>
            <p>{dueItems.slice(0, 3).map(item => `${item.company} (${prettyDate(item.followUpDate)})`).join(" · ")}{dueItems.length > 3 ? ` · +${dueItems.length - 3} more` : ""}</p>
          </div>
        </section>
      )}

      {showForm && <section className="application-form-card">
        <div className="application-form-heading">
          <div><h3>{editingId ? "Edit opportunity" : "Add an opportunity"}</h3><p>Record a job or internship you found elsewhere.</p></div>
          <button type="button" className="application-icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><X size={18} /></button>
        </div>
        <form className="application-form" onSubmit={save}>
          <div className="application-form-grid">
            <label>Company<input required maxLength="100" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Example Technologies" /></label>
            <label>Role / job title<input required maxLength="120" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Frontend Developer Intern" /></label>
            <label>Opportunity URL<input type="url" value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." /></label>
            <label>Location<input maxLength="100" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Remote / Indore / Bengaluru" /></label>
            <label>Opportunity type<select value={form.opportunityType} onChange={e => setForm({ ...form, opportunityType: e.target.value })}>{TYPES.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Current status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUSES.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Date applied<input type="date" value={form.dateApplied} onChange={e => setForm({ ...form, dateApplied: e.target.value })} /></label>
            <label>Next follow-up date<input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} /></label>
          </div>
          <label>Notes<textarea rows="3" maxLength="2000" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Recruiter contact, assessment details, preparation notes, next action..." /></label>
          <div className="application-form-actions">
            <button type="button" className="application-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="application-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Save opportunity"}</button>
          </div>
        </form>
      </section>}

      <section className="application-toolbar">
        <div className="application-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, role or location..." /></div>
        <div className="application-filter"><Filter size={16} /><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option>{STATUSES.map(value => <option key={value}>{value}</option>)}</select></div>
      </section>

      {loading ? <div className="application-empty">Loading your application tracker...</div> :
        visibleItems.length === 0 ? (
          <div className="application-empty">
            <BriefcaseBusiness size={35} />
            <h3>{items.length ? "No matching opportunities" : "Your application tracker is ready"}</h3>
            <p>{items.length ? "Try a different search or status filter." : "When you find a suitable job or internship, save it here and track what happens next."}</p>
            {items.length === 0 && <button className="application-primary" onClick={openNew}><Plus size={16} /> Add your first opportunity</button>}
          </div>
        ) : (
          <section className="application-list">
            {visibleItems.map(item => (
              <article className="application-card" key={item._id}>
                <div className="application-card-top">
                  <div className="application-company-icon"><BriefcaseBusiness size={19} /></div>
                  <div className="application-card-title"><h3>{item.role}</h3><p>{item.company}{item.location ? ` · ${item.location}` : ""}</p></div>
                  <span className={`application-status status-${item.status.toLowerCase()}`}>{item.status}</span>
                  <div className="application-card-actions">
                    <button type="button" onClick={() => openEdit(item)} aria-label="Edit opportunity"><Pencil size={16} /></button>
                    <button type="button" onClick={() => remove(item._id)} aria-label="Delete opportunity"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="application-meta">
                  <span>{item.opportunityType}</span>
                  {item.dateApplied && <span><Send size={13} /> Applied {prettyDate(item.dateApplied)}</span>}
                  {item.followUpDate && <span className={isDue(item) ? "followup-overdue" : ""}><Clock3 size={13} /> Follow up {prettyDate(item.followUpDate)}</span>}
                </div>
                {item.notes && <p className="application-notes"><MessageSquareText size={14} /> {item.notes}</p>}
                <div className="application-card-footer">
                  {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer">Open opportunity <ExternalLink size={13} /></a> : <span className="application-no-link">No opportunity link added</span>}
                  <label className="application-quick-status">Update status
                    <select value={item.status} onChange={e => updateStatus(item, e.target.value)}>
                      {STATUSES.map(value => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  {item.status === "Offer" && <span className="application-offer"><Trophy size={14} /> Offer received</span>}
                  {item.status === "Rejected" && <span className="application-rejected"><CheckCircle2 size={14} /> Closed</span>}
                </div>
              </article>
            ))}
          </section>
        )
      }
      <p className="application-disclaimer">Your tracker is private to your account. Entries are manually added by you; PathPilot does not scrape job boards, confirm that a vacancy is active, or submit applications on your behalf.</p>
    </div>
  );
}
