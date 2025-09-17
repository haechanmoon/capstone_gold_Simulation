// src/pages/HistoryDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import "../styles/HistoryDashboard.css";

type ResultKind = "correct" | "wrong" | "unsolved";
type HistoryItem = {
  id: number;
  date: string;
  type: "매수" | "매도";
  answer?: string;
  actual?: string;
  result: ResultKind;
  pnl?: number | null;
  note?: string | null;
};
type HistoryList = { items: HistoryItem[]; page: number; size: number; total: number };
type Stats = { total: number; correct: number; wrong: number; unsolved: number; accuracy: number };
type Filters = { from?: string; to?: string; type?: "" | "매수" | "매도"; sort?: string; page: number; size: number };

const RANGE_MIN = "2023-01-01";
const RANGE_MAX = "2024-12-31";

// 레전드 고정 폭
const LEGEND_W = 160;

const clampDate = (v: string) => {
  if (!v) return v;
  if (v < RANGE_MIN) return RANGE_MIN;
  if (v > RANGE_MAX) return RANGE_MAX;
  return v;
};

const qs = (obj: Record<string, unknown>) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

const fmt = (n: number, d = 1) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

async function getHistory(filters: Filters): Promise<HistoryList> {
  const url = `/api/history?${qs(filters)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`history:${res.status}`);
  return res.json();
}
async function getStats(filters: Filters): Promise<Stats> {
  const url = `/api/history/stats?${qs({ from: filters.from, to: filters.to, type: filters.type })}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`stats:${res.status}`);
  return res.json();
}

// 고정 성과 요약: 페이지 진입 시 1회만 호출
async function getSummary(): Promise<{ comment: string }> {
  const res = await fetch(`/api/history/summary`, { credentials: "include" });
  if (!res.ok) throw new Error(`summary:${res.status}`);
  const d = await res.json();

  const buy = await getStats({ from: RANGE_MIN, to: RANGE_MAX, type: "매수", page: 1, size: 1 });
  const sell = await getStats({ from: RANGE_MIN, to: RANGE_MAX, type: "매도", page: 1, size: 1 });

  const pct = (x: number) => (isFinite(x) ? x * 100 : 0);
  const sign = (x: number) => (x > 0 ? `+${fmt(x, 1)}` : fmt(x, 1));

  const line1 = `누적 정답률: ${fmt(pct(d.accuracy ?? 0), 1)}% (총 ${d.total ?? 0}회)`;
  const line2 = `매수 정답률 ${fmt(pct(buy.accuracy ?? 0), 0)}% (${buy.total ?? 0}회)`;
  const line3 = `매도 정답률 ${fmt(pct(sell.accuracy ?? 0), 0)}% (${sell.total ?? 0}회)`;
  const line4 = `총 손익: ${sign(d.totalPnl ?? 0)} (평균 ${sign(d.avgPnl ?? 0)})`;
  const line5 = `최대 이익: ${fmt(d.maxPnl ?? 0, 1)}`;
  const line6 = `최대 손실: ${fmt(d.minPnl ?? 0, 1)}`;

  return { comment: [line1, line2, line3, line4, line5, line6].join("\n") };
}

// 레전드(라벨 + 건수 + 퍼센트)
const LegendWithPercent = ({ payload }: any) => {
  const total = payload.reduce((s: number, p: any) => s + (p?.payload?.value ?? 0), 0);
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, width: LEGEND_W }}>
      {payload.map((e: any, i: number) => {
        const v = e?.payload?.value ?? 0;
        const pct = total ? (v / total) * 100 : 0;
        return (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 14, height: 14, background: e.color }} />
            <span style={{ fontSize: 14 }}>
              {e.value} {v} ({fmt(pct, 1)}%)
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default function HistoryDashboard() {
  const [filters, setFilters] = useState<Filters>({
    from: RANGE_MIN,
    to: RANGE_MAX,
    type: "",
    sort: "date,desc",
    page: 1,
    size: 20,
  });

  const [list, setList] = useState<HistoryList>({ items: [], page: 1, size: 20, total: 0 });
  const [stats, setStats] = useState<Stats>({ total: 0, correct: 0, wrong: 0, unsolved: 0, accuracy: 0 });
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    const t = setTimeout(async () => {
      try {
        const l = await getHistory(filters);
        if (!alive) return;
        setList(l);

        const s = await getStats(filters);
        if (!alive) return;
        setStats(s);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "데이터 불러오기 실패");
        setStats({ total: 0, correct: 0, wrong: 0, unsolved: 0, accuracy: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    }, 150);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [filters.from, filters.to, filters.type, filters.sort, filters.page, filters.size]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSummaryLoading(true);
        const s = await getSummary();
        if (!alive) return;
        setSummary(s.comment || "");
      } catch {
        if (!alive) return;
        setSummary("");
      } finally {
        if (alive) setSummaryLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const accuracyPct = useMemo(
    () => (stats.total - stats.unsolved > 0 ? stats.accuracy * 100 : 0),
    [stats]
  );
  const pieData = useMemo(
    () => [
      { name: "정답", value: stats.correct, key: "correct" as const },
      { name: "오답", value: stats.wrong, key: "wrong" as const },
      { name: "미풀이", value: stats.unsolved, key: "unsolved" as const },
    ],
    [stats]
  );

  const COLOR_VAR: Record<ResultKind, string> = {
    correct: "var(--color-correct)",
    wrong: "var(--color-wrong)",
    unsolved: "var(--color-unsolved)",
  };

  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));
  const setSize = (s: number) => setFilters((f) => ({ ...f, size: s, page: 1 }));

  return (
    <div className="hd hd-page">
      <h1 className="hd-title">과거 이력</h1>

      <div className="hd-main">
        {/* Left */}
        <div>
          <div className="hd-filters">
            <div>
              <label className="hd-label">시작일</label>
              <input
                type="date"
                min={RANGE_MIN}
                max={RANGE_MAX}
                value={filters.from || ""}
                onChange={(e) => setFilters((f) => ({ ...f, from: clampDate(e.target.value), page: 1 }))}
              />
            </div>
            <div>
              <label className="hd-label">종료일</label>
              <input
                type="date"
                min={RANGE_MIN}
                max={RANGE_MAX}
                value={filters.to || ""}
                onChange={(e) => setFilters((f) => ({ ...f, to: clampDate(e.target.value), page: 1 }))}
              />
            </div>
            <div>
              <label className="hd-label">타입</label>
              <select
                value={filters.type || ""}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"], page: 1 }))}
              >
                <option value="">전체</option>
                <option value="매수">매수</option>
                <option value="매도">매도</option>
              </select>
            </div>
          </div>

          <div className="hd-card">
            <div className="hd-card-header">
              <div>이력</div>
              <div className="hd-toolbar">
                <select value={filters.size} onChange={(e) => setSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
                  <option value="date,desc">날짜 최신순</option>
                  <option value="date,asc">날짜 과거순</option>
                </select>
              </div>
            </div>

            <div className="hd-card-body">
              <div className="hd-table-scroll">
                <table className="hd-table">
                  <thead>
                    <tr>
                      <th>날짜</th>
                      <th>매수/매도</th>
                      <th>예측</th>
                      <th>실제</th>
                      <th>결과</th>
                      <th className="right">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                          불러오는 중
                        </td>
                      </tr>
                    ) : list.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      list.items.map((r) => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>{r.type}</td>
                          <td>{r.answer || "-"}</td>
                          <td>{r.actual ?? "-"}</td>
                          <td>
                            {r.result === "correct" && <span className="hd-result-correct">정답</span>}
                            {r.result === "wrong" && <span className="hd-result-wrong">오답</span>}
                            {r.result === "unsolved" && <span className="hd-result-unsolved">미풀이</span>}
                          </td>
                          <td className="right">{r.pnl ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="hd-row hd-pagination" style={{ marginTop: 12 }}>
                <div className="hd-muted">
                  총 {list.total}건 • {list.page}/{Math.max(1, Math.ceil(list.total / list.size))} 페이지
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="hd-btn" onClick={() => setPage(1)} disabled={list.page <= 1}>처음</button>
                  <button className="hd-btn" onClick={() => setPage(list.page - 1)} disabled={list.page <= 1}>이전</button>
                  <button
                    className="hd-btn"
                    onClick={() => setPage(list.page + 1)}
                    disabled={list.page >= Math.ceil(list.total / list.size)}
                  >다음</button>
                  <button
                    className="hd-btn"
                    onClick={() => setPage(Math.max(1, Math.ceil(list.total / list.size)))}
                    disabled={list.page >= Math.ceil(list.total / list.size)}
                  >마지막</button>
                </div>
              </div>

              {err && <div style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{err}</div>}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="hd-right">
          <div className="hd-card chart-card">
            <div className="hd-card-header">
              <div>정답/오답/미풀이</div>
              <span className="hd-small">정확도 {fmt(accuracyPct)}%</span>
            </div>
            <div className="hd-card-body">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={pieData}
                      innerRadius={0}
                      outerRadius={120}
                      paddingAngle={3}
                      label={false}
                      labelLine={false}
                      stroke="none"
                      cx="45%"                 // 파이 중심 고정
                    >
                      {pieData.map((entry) => (
                        <Cell key={`c-${entry.key}`} fill={COLOR_VAR[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}건`} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ width: LEGEND_W }}   // 레전드 폭 고정
                      content={<LegendWithPercent />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="hd-card summary-card">
            <div className="hd-card-header">성과 요약</div>
            <div className="hd-card-body" style={{ display: "flex", alignItems: "center" }}>
              <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 16, lineHeight: 1.6 }}>
                {summaryLoading ? "분석 중" : summary || "요약 코멘트 없음"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
