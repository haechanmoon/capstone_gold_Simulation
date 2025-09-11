// src/pages/SimulationDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type SimParams = {
  capital: number;     // 초기 자본
  horizon: number;     // 일수
  risk: number;        // 0~100
  scenario: "보수" | "중립" | "공격";
};

type SimKpis = {
  finalValue: number;
  pnlPct: number;      // %
  mddPct: number;      // %
  winRatePct: number;  // %
  trades: number;
};

type EquityPoint = { day: string; value: number };
type SimResult = { equity: EquityPoint[]; kpis: SimKpis; dist: { win: number; lose: number; flat: number } };

type Summary = {
  // 최근 30일 개요(선택)
  runs: number;
  avgPnL: number;
  bestPnL: number;
  worstPnL: number;
};

const fmt = (n: number, d = 2) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

// 백엔드 연결 시 false로
const USE_MOCK = true;

// ===== 실제 API =====
async function postSimulate(p: SimParams): Promise<SimResult> {
  if (USE_MOCK) return mockSimulate(p);
  const res = await fetch("/api/simulation/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`simulate:${res.status}`);
  return res.json();
}

async function getSummary(): Promise<Summary> {
  if (USE_MOCK) return mockSummary();
  const res = await fetch("/api/simulation/summary", { credentials: "include" });
  if (!res.ok) throw new Error(`summary:${res.status}`);
  return res.json();
}

// ===== 목업 =====
function mockSimulate(p: SimParams): Promise<SimResult> {
  const days = Math.max(10, Math.min(120, p.horizon));
  const drift = p.scenario === "보수" ? 0.0008 : p.scenario === "중립" ? 0.0012 : 0.0018;
  const vol = (p.risk / 100) * 0.02 + 0.005;
  let equity = p.capital;
  let peak = equity;
  let maxDrawdown = 0;
  const eq: EquityPoint[] = [];
  let wins = 0, loses = 0, flats = 0;

  for (let i = 0; i < days; i++) {
    const r = drift + (Math.random() - 0.5) * vol * 2;
    const old = equity;
    equity = Math.max(1, equity * (1 + r));
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;

    const delta = equity - old;
    if (Math.abs(delta) < 1e-6) flats++;
    else if (delta > 0) wins++;
    else loses++;

    eq.push({ day: String(i + 1), value: Number(equity.toFixed(2)) });
  }

  const pnlPct = ((equity - p.capital) / p.capital) * 100;
  const winRate = wins / Math.max(1, wins + loses) * 100;

  const kpis: SimKpis = {
    finalValue: Number(equity.toFixed(2)),
    pnlPct: Number(pnlPct.toFixed(2)),
    mddPct: Number((maxDrawdown * 100).toFixed(2)),
    winRatePct: Number(winRate.toFixed(2)),
    trades: wins + loses + flats,
  };
  return Promise.resolve({
    equity: eq,
    kpis,
    dist: { win: wins, lose: loses, flat: flats },
  });
}

function mockSummary(): Promise<Summary> {
  return Promise.resolve({ runs: 124, avgPnL: 2.7, bestPnL: 14.2, worstPnL: -9.6 });
}

// ===== 컴포넌트 =====
export default function SimulationDashboard(): ReactNode {
  const [params, setParams] = useState<SimParams>({ capital: 1_000_000, horizon: 30, risk: 40, scenario: "중립" });
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<SimResult | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;
    getSummary().then((s) => alive && setSum(s)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const run = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await postSimulate(params);
      setRes(r);
    } catch (e: any) {
      setErr(e?.message || "시뮬레이션 실패");
    } finally {
      setLoading(false);
    }
  };

  const pieData = useMemo(() => {
    if (!res) return [];
    return [
      { name: "이익", value: res.dist.win, key: "win" as const },
      { name: "손실", value: res.dist.lose, key: "lose" as const },
      { name: "변동없음", value: res.dist.flat, key: "flat" as const },
    ];
  }, [res]);

  const COLORS = ["#16a34a", "#ef4444", "#9ca3af"];

  return (
    <div className="p-4 md:p-6 w-full mx-auto max-w-[1200px]">
      <h1 className="text-2xl font-semibold mb-4">시뮬레이션 대시보드</h1>

      {/* 상단 컨트롤 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">초기 자본(원)</label>
          <input
            type="number"
            className="w-full border rounded-md p-2"
            value={params.capital}
            onChange={(e) => setParams((p) => ({ ...p, capital: Math.max(1, Number(e.target.value || 0)) }))}
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">기간(일)</label>
          <input
            type="number"
            className="w-full border rounded-md p-2"
            value={params.horizon}
            onChange={(e) => setParams((p) => ({ ...p, horizon: Math.max(10, Math.min(180, Number(e.target.value || 0))) }))}
          />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">리스크(0~100)</label>
          <input
            type="range"
            className="w-full"
            min={0}
            max={100}
            value={params.risk}
            onChange={(e) => setParams((p) => ({ ...p, risk: Number(e.target.value) }))}
          />
          <div className="text-xs text-gray-600 mt-1">{params.risk}</div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">시나리오</label>
          <select
            className="w-full border rounded-md p-2"
            value={params.scenario}
            onChange={(e) => setParams((p) => ({ ...p, scenario: e.target.value as SimParams["scenario"] }))}
          >
            <option value="보수">보수</option>
            <option value="중립">중립</option>
            <option value="공격">공격</option>
          </select>
        </div>
        <div className="md:col-span-1 flex items-end">
          <button
            className="w-full border rounded-md p-2 bg-black text-white disabled:opacity-50"
            onClick={run}
            disabled={loading}
          >
            {loading ? "실행 중" : "실행"}
          </button>
        </div>
      </div>

      {/* 개요 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-500">최근 실행 수</div>
          <div className="text-xl font-semibold">{sum?.runs ?? "-"}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-500">평균 수익률</div>
          <div className="text-xl font-semibold">{sum ? `${fmt(sum.avgPnL)}%` : "-"}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-500">최고 수익률</div>
          <div className="text-xl font-semibold">{sum ? `${fmt(sum.bestPnL)}%` : "-"}</div>
        </div>
        <div className="border rounded-xl p-3">
          <div className="text-sm text-gray-500">최저 수익률</div>
          <div className="text-xl font-semibold">{sum ? `${fmt(sum.worstPnL)}%` : "-"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 좌: 자본곡선 */}
        <div className="md:col-span-8">
          <div className="border rounded-xl p-3">
            <div className="text-lg font-medium mb-2">자본 곡선</div>
            <div className="h-80">
              {res?.equity?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={res.equity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name="자본" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">실행 결과 없음</div>
              )}
            </div>
          </div>
        </div>

        {/* 우: 분포 + KPI */}
        <div className="md:col-span-4">
          <div className="border rounded-xl p-3 mb-4">
            <div className="text-lg font-medium mb-2">승/패/보 분포</div>
            <div className="h-64">
              {res ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={pieData} innerRadius={55} outerRadius={85} label>
                      {pieData.map((e, i) => <Cell key={e.key} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}건`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">실행 결과 없음</div>
              )}
            </div>
          </div>

          <div className="border rounded-xl p-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">최종 자본</div>
              <div className="text-lg font-semibold">{res ? fmt(res.kpis.finalValue, 0) : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">수익률</div>
              <div className="text-lg font-semibold">{res ? `${fmt(res.kpis.pnlPct)}%` : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">최대낙폭(MDD)</div>
              <div className="text-lg font-semibold">{res ? `${fmt(res.kpis.mddPct)}%` : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">승률</div>
              <div className="text-lg font-semibold">{res ? `${fmt(res.kpis.winRatePct)}%` : "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
    </div>
  );
}
