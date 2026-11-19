import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpenCheck, BrainCircuit, LayoutDashboard, LogOut, UserRound,
  Sparkles, Map, TrendingUp, Target, BriefcaseBusiness, Code2,
  FileCheck2, ClipboardList, Mic2, BadgeCheck, TerminalSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/assessment", label: "Career assessment", icon: BookOpenCheck },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/roadmaps", label: "My roadmaps", icon: Map },
  { to: "/progress", label: "Career progress", icon: TrendingUp },
  { to: "/intelligence", label: "Career intelligence", icon: Target },
  { to: "/skill-checks", label: "Skill checks", icon: BadgeCheck },
  { to: "/coding-challenges", label: "Coding challenges", icon: TerminalSquare },
  { to: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { to: "/applications", label: "Application tracker", icon: ClipboardList },
  { to: "/interview-studio", label: "Interview studio", icon: Mic2 },
  { to: "/github-portfolio", label: "GitHub portfolio", icon: Code2 },
  { to: "/project-evidence", label: "Project evidence", icon: FileCheck2 },
  { to: "/profile", label: "My profile", icon: UserRound },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><BrainCircuit size={22} /></span><span>PathPilot</span></div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-mini"><div className="avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div><div className="user-mini-copy"><strong>{user?.name || "Student"}</strong><span>{user?.email || ""}</span></div></div>
          <button className="logout-button" onClick={handleLogout}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div><span className="eyebrow">YOUR CAREER, YOUR DIRECTION</span><h1>Career workspace</h1></div><div className="topbar-user"><span className="status-dot" /> Your progress, one step at a time</div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
