import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";

export default function DeleteAccount() {
    const nav = useNavigate();
    const [password, setPassword] = useState("");
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [done, setDone] = useState(false);

    const canSubmit = !!password && agree && !loading;

    async function submit(e: FormEvent) {
        e.preventDefault();
        setErr("");
        try {
            setLoading(true);
            const res = await fetch("/api/auth/deleteAccount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password }),
            });
            if (!res.ok) throw new Error("탈퇴 실패");
            setDone(true);
        } catch (e: any) {
            setErr(e.message || "탈퇴 실패");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCard title="회원 탈퇴">
            {done ? (
                <div style={{ textAlign: "center" }}>
                    계정이 비활성화되었습니다. 30일 후 영구 삭제됩니다.
                    <div style={{ marginTop: 16 }}>
                        <button className="auth-btn" onClick={() => nav("/login")}>
                            로그인 페이지로 이동
                        </button>
                    </div>
                </div>
            ) : (
                <form className="auth-form" onSubmit={submit}>
                    {/* 안내 박스 */}
                    <div className="notice-box">
                        <strong>안내</strong>
                        <ul>
                            <li>탈퇴 후 30일 동안은 로그인할 수 없으며, 그 이후 계정은 영구 삭제됩니다.</li>
                            <li>시뮬레이션 이력 등 서비스 이용 기록은 모두 삭제됩니다.</li>
                            <li>삭제 이후 복구는 불가능합니다.</li>
                        </ul>
                    </div>

                    {/* 체크박스 */}
                    <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                        />
                        위 내용을 확인하였으며 계정 삭제에 동의합니다.
                    </label>

                    {/* 비밀번호 입력 */}
                    <div className="field">
                        <label htmlFor="pwd">현재 비밀번호</label>
                        <input
                            id="pwd"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {err && <div className="auth-error">{err}</div>}

                    <button className="auth-btn" disabled={!canSubmit}>
                        {loading ? "처리 중..." : "회원 탈퇴"}
                    </button>
                </form>
            )}
        </AuthCard>
    );
}
