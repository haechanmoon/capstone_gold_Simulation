import { useEffect, useState } from "react";

function getCsrf() {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function MyPage() {
  const [me, setMe] = useState<{ username?: string }>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setMe)
      .catch(() => setErr("불러오기 실패"));
  }, []);

  async function logout() {
    await fetch("/logout", {
      method: "POST",
      credentials: "include",
      headers: { "X-XSRF-TOKEN": getCsrf() }
    });
    location.href = "/login";
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>My Page</h2>
      {err ? <p>{err}</p> :
        <p>로그인 사용자: <b>{me.username}</b></p>}
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
