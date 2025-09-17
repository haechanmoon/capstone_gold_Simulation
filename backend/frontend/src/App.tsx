// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import SimulationDashboard from "./pages/SimulationDashboard";
import HistoryDashboard from "./pages/HistoryDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TopBar from "./components/TopBar";
import type { ReactNode } from "react";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";

function Protected({ children, authed }: { children: ReactNode; authed: boolean }) {
  return authed ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [memberName, setUserName] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");
  const loc = useLocation();
  const nav = useNavigate();

  async function refreshAuth() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) { setAuthed(false); setUserName(""); setMemberId(""); return; }
      const me = await res.json().catch(() => ({}));
      setAuthed(true);
      setUserName(me?.memberName ?? me?.name ?? "");
      setMemberId(me?.memberId ?? me?.id ?? "");
    } catch {
      setAuthed(false); setUserName(""); setMemberId("");
    }
  }
  useEffect(() => { refreshAuth(); }, [loc.pathname]);

  async function onLogout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); }
    finally {
      setAuthed(false); setUserName(""); setMemberId("");
      nav("/", { replace: true }); // 로그아웃 후 대시보드로
    }
  }

  return (
    <>
      <TopBar
        isAuthed={authed}
        memberName={memberName}
        memberId={memberId}
        onLogout={onLogout}
        onChangePassword={() => nav("/updatePassword")}
        onDeleteAccount={() => nav("/deleteAccount")}
      />

      <Routes>
        {/* 기본 경로 = 공개 시뮬레이션 대시보드 */}
        <Route path="/" element={<SimulationDashboard />} />
        <Route path="/simulation" element={<SimulationDashboard />} />

        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />

        {/* 보호 라우트 */}
        <Route path="/history" element={<Protected authed={authed}><HistoryDashboard /></Protected>} />
        <Route path="/updatePassword" element={<Protected authed={authed}><ChangePassword /></Protected>} />
        <Route path="/deleteAccount" element={<Protected authed={authed}><DeleteAccount /></Protected>} />

        {/* 그 외 → 대시보드 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
