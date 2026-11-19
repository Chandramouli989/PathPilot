import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Recommendations from "./pages/Recommendations";
import Roadmaps from "./pages/Roadmaps";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import CareerIntelligence from "./pages/CareerIntelligence";
import Opportunities from "./pages/Opportunities";
import GitHubPortfolio from "./pages/GitHubPortfolio";
import ProjectEvidence from "./pages/ProjectEvidence";
import ApplicationTracker from "./pages/ApplicationTracker";
import InterviewStudio from "./pages/InterviewStudio";
import SkillChecks from "./pages/SkillChecks";
import CodingChallenges from "./pages/CodingChallenges";


function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading your workspace...</div>;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/intelligence" element={<CareerIntelligence />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/github-portfolio" element={<GitHubPortfolio />} />
          <Route path="/project-evidence" element={<ProjectEvidence />} />
          <Route path="/applications" element={<ApplicationTracker />} />
          <Route path="/interview-studio" element={<InterviewStudio />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/skill-checks" element={<SkillChecks />} />
          <Route path="/coding-challenges" element={<CodingChallenges />} />
        </Route>
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
