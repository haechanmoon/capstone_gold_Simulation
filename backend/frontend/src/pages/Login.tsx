// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import AuthCard from "../components/AuthCard";

type LoginForm = { memberId: string; memberPwd: string; remember: boolean };

export default function Login(): ReactNode {
  const nav = useNavigate();
  const [form, setForm] = useState<LoginForm>({ memberId: "", memberPwd: "", remember: false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("saved_memberId");
    if (saved) setForm(s => ({ ...s, memberId: saved, remember: true }));
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const v = type === "checkbox" ? checked : value;
    setForm(s => ({ ...s, [name]: v }));

    if (name === "remember") {
      if (checked) localStorage.setItem("saved_memberId", form.memberId);
      else localStorage.removeItem("saved_memberId");
    }
    if (name === "memberId" && form.remember) {
      localStorage.setItem("saved_memberId", value);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId: form.memberId, memberPwd: form.memberPwd }),
      });
      if (!res.ok) { setErr("아이디 또는 비밀번호가 올바르지 않습니다."); return; }
      if (!form.remember) localStorage.removeItem("saved_memberId");
      nav("/");
    } catch {
      setErr("네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="로그인"
      footer={
        <>
          계정이 없나요? <Link className="link" to="/signup">회원가입</Link>
          <div style={{ marginTop: 8 }}>
            <Link className="link" to="/forgotPassword">비밀번호 찾기</Link>
          </div>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="memberId">아이디</label>
          <input
            id="memberId"
            name="memberId"
            type="text"
            placeholder="Enter your ID"
            value={form.memberId}
            onChange={onChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="memberPwd">비밀번호</label>
          <input
            id="memberPwd"
            name="memberPwd"
            type="password"
            placeholder="Enter Password"
            value={form.memberPwd}
            onChange={onChange}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="checkbox-row">
          <label>
            <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
            아이디 저장
          </label>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
