// src/components/TopBar.tsx
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import "../styles/TopBar.css";

type Props = {
  isAuthed: boolean;
  memberName?: string;   // ex) "승히"
  memberId?: string;     // ex) "test001"
  onLogout?: () => void;
  onChangePassword?: () => void;
  onDeleteAccount?: () => void;
};

export default function TopBar({
  isAuthed,
  memberName = "",
  memberId = "",
  onLogout,
  onChangePassword,
  onDeleteAccount,
}: Props) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const displayName = (memberName || memberId || "유저").trim();
  const initials = displayName.slice(0, 2);

  return (
    <header className="gs-header">
      <div className="gs-inner">
        <Link to="/" className="gs-logo" aria-label="GoldSim 홈">GoldSim</Link>

        <nav className="gs-nav" aria-label="주요 메뉴">
          <NavLink to="/simulation" className="gs-nav-item">투자 시뮬레이션</NavLink>
          <NavLink to="/battle" className="gs-nav-item">AI와 예측 대결하기</NavLink>
          <NavLink to="/history" className="gs-nav-item">내 과거 이력</NavLink>
        </nav>

        <div className="gs-right">
          <form className="gs-search" onSubmit={submit} role="search" aria-label="검색">
            <span className="gs-search-icon" aria-hidden>🔎</span>
            <input
              className="gs-search-input"
              placeholder="궁금한 경제 용어를 검색해보세요"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="gs-search-underline" />
          </form>

          {!isAuthed ? (
            <Link to="/login" className="gs-cta">로그인</Link>
          ) : (
            <div className="profile" ref={menuRef}>
              <button
                type="button"
                className="gs-avatar"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {initials}
              </button>

              {open && (
                <div className="gs-menu" role="menu">
                  {/* 헤더 */}
                  <div className="gs-menu-header">
                    <div className="gs-menu-avatar">{initials}</div>
                    <div className="gs-menu-meta">
                      <div className="gs-menu-name">{displayName}</div>
                      <div className="gs-menu-id">{memberId ? `@${memberId}` : ""}</div>
                    </div>
                  </div>
                  <div className="gs-menu-divider" />

                  {/* 항목 */}
                  <button
                    className="gs-menu-item"
                    onClick={() => { setOpen(false); onChangePassword ? onChangePassword() : nav("/updatePassword"); }}
                  >
                    비밀번호 변경
                  </button>
                  <button
                    className="gs-menu-item"
                    onClick={() => { setOpen(false); onDeleteAccount ? onDeleteAccount() : nav("/deleteAccount"); }}
                  >
                    회원탈퇴
                  </button>
                  <button
                    className="gs-menu-item danger"
                    onClick={() => { setOpen(false); onLogout?.(); }}
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
