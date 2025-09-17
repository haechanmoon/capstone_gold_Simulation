// src/pages/SimulationDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import "../styles/SimulationDashboard.css";

const DATA_MIN = "2015-01-01";
const DATA_MAX = "2024-12-31";

type Row = {
  date: string;
  fx_rate: number | null;
  vix: number | null;
  etf_volume: number | null;
  gold_close: number | null;
  pred_close: number | null;
};

type Unit = "10y" | "5y" | "1y" | "3m" | "1m" | "1w";
const UNITS: { key: Unit; label: string; days: number }[] = [
  { key: "10y", label: "10년", days: 3650 },
  { key: "5y",  label: "5년",  days: 1825 },
  { key: "1y",  label: "1년",  days: 365 },
  { key: "3m",  label: "3개월", days: 90 },
  { key: "1m",  label: "1개월", days: 30 },
  { key: "1w",  label: "1주일", days: 7 },
];

const nf0 = (n: number) => new Intl.NumberFormat().format(n ?? 0);
const nf1 = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n ?? 0);

/** series별 min–max 스케일링(0~500). null은 그대로 유지 */
function minMaxScale(values: (number | null | undefined)[]) {
  const nums = values.filter((v): v is number => v != null && isFinite(v));
  if (!nums.length) return { to: (_: number | null | undefined) => null };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  return { to: (v: number | null | undefined) => (v == null ? null : ((v - min) / span) * 500) };
}

/** 단위에 따른 X축 tick 개수와 포맷 문자열 */
function xTickConfig(unit: Unit): { count: number; fmt: "yyyy" | "yyyy-MM" | "MM-dd" } {
  switch (unit) {
    case "10y": return { count: 12, fmt: "yyyy" };
    case "5y":  return { count: 10, fmt: "yyyy" };
    case "1y":  return { count: 12, fmt: "yyyy-MM" };
    case "3m":  return { count: 8,  fmt: "MM-dd" };
    case "1m":  return { count: 8,  fmt: "MM-dd" };
    case "1w":  return { count: 7,  fmt: "MM-dd" };
  }
}

/** 외부 라이브러리 없이 yyyy-MM-dd 문자열을 간단히 포맷 */
function formatDateStr(d: string, fmt: "yyyy" | "yyyy-MM" | "MM-dd") {
  // 기대 포맷: "YYYY-MM-DD"
  if (!d || d.length < 10) return d;
  const yyyy = d.slice(0, 4);
  const MM   = d.slice(5, 7);
  const dd   = d.slice(8, 10);
  if (fmt === "yyyy") return yyyy;
  if (fmt === "yyyy-MM") return `${yyyy}-${MM}`;
  return `${MM}-${dd}`; // "MM-dd"
}

export default function SimulationDashboard() {
  const [endDate, setEndDate] = useState<string>(DATA_MAX);
  const [unit, setUnit] = useState<Unit>("1y");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const safeEnd =
      new Date(endDate) > new Date(DATA_MAX) ? DATA_MAX :
      new Date(endDate) < new Date(DATA_MIN) ? DATA_MIN : endDate;

    const qs = new URLSearchParams({ to: safeEnd, unit });
    setLoading(true);
    setErr("");
    fetch(`/api/simulation/quotes?${qs.toString()}`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: Row[]) => setRows(data ?? []))
      .catch((e) => setErr(e?.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, [endDate, unit]);

  /** 그래프1 스케일링 */
  const scaled = useMemo(() => {
    if (!rows.length) return [];
    const fxScale  = minMaxScale(rows.map((r) => r.fx_rate));
    const vixScale = minMaxScale(rows.map((r) => r.vix));
    const etfM     = rows.map((r) => (r.etf_volume == null ? null : r.etf_volume / 1_000_000));
    const etfScale = minMaxScale(etfM);

    return rows.map((r, i) => ({
      ...r,
      fx_s:  fxScale.to(r.fx_rate),
      vix_s: vixScale.to(r.vix),
      etf_s: etfScale.to(etfM[i]),
      _etf_m: etfM[i],
    }));
  }, [rows]);

  const rangeText = rows.length ? `${rows[0].date} ~ ${rows[rows.length - 1].date}` : "-";
  const { count: xTickCount, fmt } = xTickConfig(unit);
  const xTickFormatter = (d: string) => formatDateStr(d, fmt);

  return (
    <div className="sim-wrap">
      <div className="sim-controls">
        <div className="field">
          <label>종료일</label>
          <input
            type="date"
            min={DATA_MIN}
            max={DATA_MAX}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="unit-group">
          {UNITS.map((u) => (
            <button
              key={u.key}
              className={`unit ${unit === u.key ? "active" : ""}`}
              onClick={() => setUnit(u.key)}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-grid">
        <div className="sim-left">
          {/* 그래프 1 */}
          <section className="card">
            <div className="card-head">
              <h2>환율 / VIX / ETF 거래량 · 스케일(0~500)</h2>
              <span className="muted">{rangeText}</span>
            </div>
            <div className="card-body chart-300">
              {loading ? (
                <div className="empty">불러오는 중</div>
              ) : !scaled.length ? (
                <div className="empty">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scaled}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      interval="preserveStartEnd"
                      tickCount={xTickCount}
                      tickFormatter={xTickFormatter}
                    />
                    <YAxis tick={false} axisLine={false} width={0} />
                    <Tooltip
                      formatter={(v: any, name: any, p: any) => {
                        const row = p?.payload as any;
                        if (p.dataKey === "fx_s")  return [`${(v as number).toFixed(1)}`, `환율(원값 ${nf0(row.fx_rate)})`];
                        if (p.dataKey === "vix_s") return [`${(v as number).toFixed(1)}`, `VIX(원값 ${nf1(row.vix)})`];
                        if (p.dataKey === "etf_s") return [`${(v as number).toFixed(1)}`, `ETF(원값 ${nf1(row._etf_m)}M)`];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="fx_s"  name="환율(지수)"     stroke="#2563eb" dot={false} />
                    <Line type="monotone" dataKey="vix_s" name="VIX(지수)"      stroke="#f59e0b" dot={false} />
                    <Line type="monotone" dataKey="etf_s" name="ETF거래량(지수)" stroke="#10b981" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* 그래프 2 */}
          <section className="card">
            <div className="card-head">
              <h2>금 시세 vs LSTM 예측</h2>
              <span className="muted">{rangeText}</span>
            </div>
            <div className="card-body chart-320">
              {loading ? (
                <div className="empty">불러오는 중</div>
              ) : !rows.length ? (
                <div className="empty">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      interval="preserveStartEnd"
                      tickCount={xTickCount}
                      tickFormatter={xTickFormatter}
                    />
                    <YAxis tick={false} axisLine={false} width={0} />
                    <Tooltip
                      formatter={(v: any, name: any, p: any) => {
                        if (p.dataKey === "gold_close") return [nf1(v), "실제 금 시세"];
                        if (p.dataKey === "pred_close") return [nf1(v), "예측 금 시세"];
                        return [v, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="gold_close" name="실제 금 시세" stroke="#3b82f6" dot={false} />
                    <Line type="monotone" dataKey="pred_close" name="예측 금 시세" stroke="#ef4444" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        {/* 뉴스 */}
        <aside className="card news">
          <div className="card-head">
            <h2>관련 뉴스</h2>
            <span className="muted">최근 0건</span>
          </div>
          <div className="card-body news-body">
            <div className="empty">뉴스 없음</div>
          </div>
        </aside>
      </div>

      {err && <div className="err">{err}</div>}
    </div>
  );
}
