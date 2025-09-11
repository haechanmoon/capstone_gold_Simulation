// src/pages/Signup.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import AuthCard from "../components/AuthCard";

type SignupForm = {
  memberId: string;
  memberEmail: string;
  memberName: string;
  memberPwd: string;
  confirmPwd: string;
};

const PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

export default function Signup(): ReactNode {
  const nav = useNavigate();
  const [form, setForm] = useState<SignupForm>({
    memberId: "",
    memberEmail: "",
    memberName: "",
    memberPwd: "",
    confirmPwd: "",
  });

  // 아이디 중복 체크(디바운스 유지)
  const [idChecking, setIdChecking] = useState(false);
  const [idExists, setIdExists] = useState<0 | 1 | null>(null);
  const [idMsg, setIdMsg] = useState("");

  // 이메일 중복 체크(버튼 클릭 시에만)
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<0 | 1 | null>(null);
  const [emailMsg, setEmailMsg] = useState("");

  // 이메일 인증
  const [emailSending, setEmailSending] = useState(false);
  const [emailSendMsg, setEmailSendMsg] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailVerifyMsg, setEmailVerifyMsg] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState(false);

  // 전송 여부 + 3분 타이머
  const [codeRequested, setCodeRequested] = useState(false);
  const [timer, setTimer] = useState(0);

  // 에러/로딩
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 규칙 위반 여부
  const idRuleError = useMemo(
    () => form.memberId.trim().length > 0 && !/^[A-Za-z0-9]+$/.test(form.memberId),
    [form.memberId]
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));

    if (name === "memberId") {
      setIdExists(null);
      setIdChecking(false);
      setIdMsg(idRuleError ? "영문과 숫자만 입력하세요." : "");
    }

    if (name === "memberEmail") {
      setEmailVerified(false);
      setEmailVerifyError(false);
      setEmailCode("");
      setEmailVerifyMsg("");
      setEmailSendMsg("");
      setCodeRequested(false);
      setTimer(0);
      setEmailExists(null);
      setEmailMsg("");
    }
  };

  const pwdValid = useMemo(() => PWD_REGEX.test(form.memberPwd), [form.memberPwd]);
  const pwdMatch = useMemo(() => form.memberPwd === form.confirmPwd, [form.memberPwd, form.confirmPwd]);

  // 아이디 중복 체크(디바운스)
  useEffect(() => {
    const id = form.memberId.trim();
    if (!id || idRuleError) {
      if (idRuleError) setIdMsg("영문과 숫자만 입력하세요.");
      return;
    }
    const t = setTimeout(async () => {
      try {
        setIdChecking(true);
        const res = await fetch(`/api/auth/check-id?memberId=${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const raw = await res.json();
        const exists: number =
          raw && typeof raw === "object" && "exists" in raw ? Number(raw.exists) : Number(raw);
        const v = exists === 1 ? 1 : 0;
        setIdExists(v);
        setIdMsg(v === 0 ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.");
      } catch {
        setIdExists(null);
        setIdMsg("중복 체크 실패");
      } finally {
        setIdChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.memberId, idRuleError]);

  // 타이머
  useEffect(() => {
    if (timer <= 0) return;
    const iv = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [timer]);

  const mmss = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(1, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 코드 전송: 버튼 클릭 시 이메일 중복 체크 → 통과 시 전송
  const sendCode = async () => {
    const email = form.memberEmail.trim();
    setEmailSendMsg("");
    setEmailVerifyMsg("");
    setEmailVerifyError(false);
    setEmailMsg("");
    setEmailExists(null);

    if (!email) {
      setEmailSendMsg("이메일을 입력하세요.");
      return;
    }

    // 1) 서버에 이메일 중복 체크(버튼 클릭 시에만)
    try {
      setEmailChecking(true);
      const chk = await fetch(`/api/auth/check-email?memberEmail=${encodeURIComponent(email)}`, {
        credentials: "include",
      });
      if (!chk.ok) throw new Error();
      const raw = await chk.json();
      const exists: number =
        raw && typeof raw === "object" && "exists" in raw ? Number(raw.exists) : Number(raw);
      if (exists === 1) {
        setEmailExists(1);
        setEmailMsg("이미 사용 중인 이메일입니다.");
        return; // 전송 중단
      }
      setEmailExists(0);
      setEmailMsg("사용 가능한 이메일입니다.");
    } catch {
      setEmailExists(null);
      setEmailMsg("이메일 중복 체크 실패");
      return;
    } finally {
      setEmailChecking(false);
    }

    // 2) 통과했고, 전송 가능 상태
    try {
      setEmailSending(true);
      const res = await fetch("/api/auth/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      const ok = data?.ok ?? true;
      if (!ok) throw new Error();
      setEmailSendMsg("인증코드를 전송했습니다. 3분 이내 입력하세요.");
      setCodeRequested(true);
      setTimer(180);
      setEmailVerified(false);
    } catch {
      setEmailSendMsg("전송 실패. 잠시 후 다시 시도하세요.");
    } finally {
      setEmailSending(false);
    }
  };

  // 코드 검증
  const verifyCode = async () => {
    const email = form.memberEmail.trim();
    const code = emailCode.trim();
    setEmailVerifyMsg("");
    setEmailVerifyError(false);
    if (!email) {
      setEmailVerifyMsg("이메일을 입력하세요.");
      return;
    }
    if (!code) {
      setEmailVerifyMsg("인증코드를 입력하세요.");
      return;
    }
    if (timer <= 0) {
      setEmailVerifyMsg("인증코드가 만료되었습니다. 재전송하세요.");
      return;
    }
    try {
      setEmailVerifying(true);
      const res = await fetch("/api/auth/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        setEmailVerified(false);
        setEmailVerifyError(true);
        setEmailVerifyMsg("인증 코드가 틀렸습니다. 다시 확인해주세요.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      const ok = data?.ok ?? false;
      if (ok) {
        setEmailVerified(true);
        setEmailVerifyError(false);
        setEmailVerifyMsg("이메일 인증이 완료되었습니다.");
      } else {
        setEmailVerified(false);
        setEmailVerifyError(true);
        setEmailVerifyMsg("인증 코드가 틀렸습니다. 다시 확인해주세요.");
      }
    } catch {
      setEmailVerified(false);
      setEmailVerifyError(true);
      setEmailVerifyMsg("인증 코드가 틀렸습니다. 다시 확인해주세요.");
    } finally {
      setEmailVerifying(false);
    }
  };

  // 제출
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    if (!pwdValid) { setErr("비밀번호 규칙을 확인하세요."); return; }
    if (!pwdMatch) { setErr("비밀번호가 일치하지 않습니다."); return; }
    if (idExists === 1) { setErr("이미 사용 중인 아이디입니다."); return; }
    // 이메일은 전송→인증 필수이므로 emailVerified로만 검증
    if (!emailVerified) { setErr("이메일 인증을 완료하세요."); return; }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          memberId: form.memberId.trim(),
          memberEmail: form.memberEmail.trim(),
          memberName: form.memberName.trim(),
          memberPwd: form.memberPwd,
        }),
      });
      if (!res.ok) throw new Error();
      nav("/login");
    } catch {
      setErr("회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  // 활성화 조건
  const allFilled =
    form.memberId.trim() &&
    form.memberEmail.trim() &&
    form.memberName.trim() &&
    form.memberPwd &&
    form.confirmPwd;
  const canSubmit =
    Boolean(allFilled) &&
    !idRuleError &&
    idExists === 0 &&
    pwdValid &&
    pwdMatch &&
    !idChecking &&
    !emailChecking && // 전송 버튼 직전 체크가 오래 걸릴 때 대비
    emailVerified;

  const canResend = timer <= 0 && !emailSending;

  return (
    <AuthCard
      title="회원가입"
      footer={<>이미 계정이 있나요? <Link className="link" to="/login">Sign in</Link></>}
    >
      <form className="auth-form" onSubmit={submit}>
        {/* ID */}
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
          <div
            className={`auth-msg ${idRuleError ? "error" : idExists === 0 ? "success" : idExists === 1 ? "error" : ""}`}
          >
            {idRuleError ? "영문과 숫자만 입력하세요." : idChecking ? "\u00A0" : idMsg || "\u00A0"}
          </div>
        </div>

        {/* Email + 전송 버튼 */}
        <div className="field">
          <label htmlFor="memberEmail">이메일</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              id="memberEmail"
              name="memberEmail"
              type="email"
              placeholder="Enter your Email"
              value={form.memberEmail}
              onChange={onChange}
              required
              disabled={emailVerified}
            />
            <button
              type="button"
              className="auth-btn"
              onClick={sendCode}
              disabled={!form.memberEmail.trim() || !canResend || emailVerified || emailChecking}
            >
              {emailSending ? "전송중" : timer > 0 ? `${mmss(timer)}` : "인증코드 전송"}
            </button>
          </div>
          {/* 중복 체크/전송 결과 메시지 */}
          <div
            className={`auth-msg ${emailExists === 1 ? "error" : emailVerified || emailExists === 0 ? "success" : ""
              }`}
          >
            {emailMsg || (emailVerified ? "이메일 인증 완료" : emailSendMsg || "\u00A0")}
          </div>
        </div>

        {/* 인증코드 입력 + 확인 */}
        <div className="field">
          <label htmlFor="emailCode">인증코드</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              id="emailCode"
              name="emailCode"
              placeholder="6자리 코드를 입력"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
              disabled={emailVerified || timer <= 0}
              inputMode="numeric"
              pattern="\d*"
            />
            <button
              type="button"
              className="auth-btn"
              onClick={verifyCode}
              disabled={emailVerified || emailVerifying || !emailCode.trim() || timer <= 0}
            >
              {emailVerifying ? "확인중" : "확인"}
            </button>
          </div>
          <div
            className={`auth-msg ${emailVerified ? "success" : emailVerifyError || (codeRequested && timer <= 0) ? "error" : ""}`}
          >
            {emailVerifyMsg ||
              (codeRequested && timer <= 0 && !emailVerified ? "코드가 만료되었습니다. 재전송하세요." : "\u00A0")}
          </div>
        </div>

        {/* Name */}
        <div className="field">
          <label htmlFor="memberName">이름</label>
          <input
            id="memberName"
            name="memberName"
            type="text"
            placeholder="Enter your Name"
            value={form.memberName}
            onChange={onChange}
            required
          />
          <div className="auth-msg">{"\u00A0"}</div>
        </div>

        {/* Password */}
        <div className="field">
          <label htmlFor="memberPwd">비밀번호</label>
          <input
            id="memberPwd"
            name="memberPwd"
            type="password"
            placeholder="Enter Password"
            value={form.memberPwd}
            onChange={onChange}
            required
            aria-describedby="pwd-help"
          />
          <div id="pwd-help" className={`auth-msg ${pwdValid ? "success" : ""}`}>
            최소 8자, 대/소문자·숫자·특수문자 각 1개 이상
          </div>
        </div>

        {/* Confirm */}
        <div className="field">
          <label htmlFor="confirmPwd">비밀번호 확인</label>
          <input
            id="confirmPwd"
            name="confirmPwd"
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPwd}
            onChange={onChange}
            required
          />
          <div className={`auth-msg ${form.confirmPwd ? (pwdMatch ? "success" : "error") : ""}`}>
            {form.confirmPwd ? (pwdMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.") : "\u00A0"}
          </div>
        </div>

        {err && <div className="auth-error">{err}</div>}

        <button className="auth-btn" disabled={loading || !canSubmit}>
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>
    </AuthCard>
  );
}
