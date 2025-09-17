import { useState } from "react";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import AuthCard from "../components/AuthCard";

export default function ForgotPassword() {
  const [memberId, setMemberId] = useState("");
  const [memberEmail, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/auth/forgotPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, memberEmail }),
    });
    if (res.ok) setDone(true);
    else setErr("요청을 처리할 수 없습니다.");
  }

  return (
    <AuthCard
      title="비밀번호 찾기"
      footer={<Link className="link" to="/login">로그인으로 돌아가기</Link>}
    >
      {done ? (
        <p className="auth-sub">임시 비밀번호를 이메일로 보냈습니다. 로그인 후 비밀번호를 변경하세요.</p>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="fid">아이디</label>
            <input id="fid" value={memberId} onChange={e => setMemberId(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="fem">이메일</label>
            <input id="fem" type="email" value={memberEmail} onChange={e => setEmail(e.target.value)} required />
          </div>
          {err && <div className="auth-error">{err}</div>}
          <button type="submit">임시 비밀번호 발송</button>
        </form>
      )}
    </AuthCard>
  );
}
