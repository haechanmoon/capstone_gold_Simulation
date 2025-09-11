// src/pages/ChangePassword.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import AuthCard from "../components/AuthCard";

const PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

export default function ChangePassword() {
  const nav = useNavigate();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const pwdValid = useMemo(() => PWD_REGEX.test(newPwd), [newPwd]);
  const pwdMatch = useMemo(() => newPwd === confirmPwd, [newPwd, confirmPwd]);
  const canSubmit = currentPwd && pwdValid && pwdMatch && !loading;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!pwdValid) { setErr("새 비밀번호 규칙을 확인하세요."); return; }
    if (!pwdMatch) { setErr("새 비밀번호가 일치하지 않습니다."); return; }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/updatePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPwd, newPwd, confirmPwd }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "변경 실패");
      }
      setDone(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e: any) {
      setErr(e.message || "변경 실패");
    } finally {
      setLoading(false);
    }
  }

  async function logoutAndGoLogin() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); }
    finally { nav("/login", { replace: true }); }
  }

  return (
    <AuthCard title="비밀번호 변경">
      {done ? (
        <div className="auth-sub" style={{ textAlign: "center" }}>
          비밀번호를 변경했습니다. 보안을 위해 다시 로그인하세요.
          <div style={{ marginTop: 16 }}>
            <button className="auth-btn" onClick={logoutAndGoLogin}>로그아웃 후 로그인</button>
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="cur">현재 비밀번호</label>
            <input id="cur" type="password" value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="new">새 비밀번호</label>
            <input id="new" type="password" value={newPwd}
              onChange={e => setNewPwd(e.target.value)} required aria-describedby="pwd-help" />
            <div id="pwd-help" className={`auth-msg ${pwdValid ? "success" : ""}`}>
              최소 8자, 대/소문자·숫자·특수문자 각 1개 이상
            </div>
          </div>

          <div className="field">
            <label htmlFor="cnf">새 비밀번호 확인</label>
            <input id="cnf" type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)} required />
            <div className={`auth-msg ${confirmPwd ? (pwdMatch ? "success" : "error") : ""}`}>
              {confirmPwd ? (pwdMatch ? "일치합니다." : "일치하지 않습니다.") : "\u00A0"}
            </div>
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button className="auth-btn" disabled={!canSubmit}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
