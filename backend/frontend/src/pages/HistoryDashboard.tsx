// src/pages/HistoryDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

/* ================= Types ================= */
type ResultKind = "correct" | "wrong" | "unsolved";

type HistoryItem = {
  id: number;
  date: string;           // YYYY-MM-DD
  type?: string;
  question?: string;
  answer?: string;
  result: ResultKind;
  pnl?: number | null;
  note?: string | null;
};

type HistoryList = {
  items: HistoryItem[];
  page: number;
  size: number;
  total: number;
};

type Stats = {
  total: number;
  correct: number;
  wrong: number;
  unsolved: number;
  accuracy: number; // 0..1
};

type Filters = {
  from?: string;
  to?: string;
  type?: string;
  keyword?: string;
  sort?: string; // e.g., "date,desc"
  page: number;
  size: number;
};

/* ================= Utils ================= */
const qs = (obj: Record<string, unknown>) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

const fmt = (n: number, d = 1) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/* =============== API (with session) =============== */
async function getHistory(filters: Filters): Promise<HistoryList> {
  const url = `/api/history?${qs(filters)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`history:${res.status}`);
  return res.json();
}

async function getStats(filters: Filters): Promise<Stats> {
  const url = `/api/history/stats?${qs({ from: filters.from, to: filters.to })}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`stats:${res.status}`);
  return res.json();
}

async function getInsights(filters: Filters): Promise<{ comment: string }> {
  const url = `/api/history/insights?${qs({ from: filters.from, to: filters.to })}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`insights:${res.status}`);
  return res.json();
}

/* ================= Styled ================= */
const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
`;
const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px;
`;
const FiltersGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin-bottom: 16px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(6, 1fr);
  }
`;
const Label = styled.label`
  display: block;
  font-size: 12px;
  color: #475569;
  margin-bottom: 6px;
`;
const Input = styled.input`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
`;
const Select = styled.select`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: #fff;
`;
const MainGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  @media (min-width: 768px) {
    grid-template-columns: 7fr 5fr;
  }
`;
const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
`;
const CardBody = styled.div`
  padding: 12px;
`;
const CardHeader = styled.div`
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
`;
const Small = styled.div`
  font-size: 12px;
  color: #64748b;
`;
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  thead {
    background: #f8fafc;
  }
  th, td {
    padding: 8px;
    border-bottom: 1px solid #eef2f7;
    text-align: left;
  }
  tbody tr:nth-child(even) {
    background: #fafafa;
  }
  td.right { text-align: right; }
`;
const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;
const Button = styled.button`
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  &:disabled { opacity: .5; cursor: default; }
`;
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const Muted = styled.div`
  color: #64748b;
  font-size: 13px;
`;

/* ================= Component ================= */
export default function HistoryDashboard(): ReactNode {
  // lazy init for range
  const [filters, setFilters] = useState<Filters>(() => {
    const { from, to } = defaultRange();
    return { from, to, type: "", keyword: "", sort: "date,desc", page: 1, size: 20 };
  });

  const [list, setList] = useState<HistoryList>({ items: [], page: 1, size: 20, total: 0 });
  const [stats, setStats] = useState<Stats>({ total: 0, correct: 0, wrong: 0, unsolved: 0, accuracy: 0 });
  const [insight, setInsight] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    const t = setTimeout(async () => {
      try {
        const [l, s, i] = await Promise.all([getHistory(filters), getStats(filters), getInsights(filters)]);
        if (!alive) return;
        setList(l);
        setStats(s);
        setInsight(i.comment);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "데이터 불러오기 실패");
      } finally {
        if (alive) setLoading(false);
      }
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [filters.from, filters.to, filters.type, filters.keyword, filters.sort, filters.page, filters.size]);

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

  const COLORS = ["#16a34a", "#ef4444", "#9ca3af"];

  const setPage = (p: number) => setFilters((f) => ({ ...f, page: p }));
  const setSize = (s: number) => setFilters((f) => ({ ...f, size: s, page: 1 }));

  return (
    <Page>
      <Title>내 이력 보기</Title>

      {/* Filters */}
      <FiltersGrid>
        <div>
          <Label>시작일</Label>
          <Input type="date" value={filters.from || ""} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))} />
        </div>
        <div>
          <Label>종료일</Label>
          <Input type="date" value={filters.to || ""} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))} />
        </div>
        <div>
          <Label>타입</Label>
          <Select value={filters.type || ""} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}>
            <option value="">전체</option>
            <option value="예측">예측</option>
            <option value="실제">실제</option>
          </Select>
        </div>
        <div>
          <Label>검색</Label>
          <Input placeholder="키워드" value={filters.keyword || ""} onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value, page: 1 }))} />
        </div>
      </FiltersGrid>

      <MainGrid>
        {/* Left: table */}
        <div>
          <Card>
            <CardHeader>
              <div>이력</div>
              <Toolbar>
                <Select value={filters.size} onChange={(e) => setSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </Select>
                <Select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
                  <option value="date,desc">날짜 최신순</option>
                  <option value="date,asc">날짜 오래된순</option>
                </Select>
              </Toolbar>
            </CardHeader>

            <CardBody>
              <StyledTable>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>타입</th>
                    <th>예측</th>
                    <th>결과</th>
                    <th className="right">PnL</th>
                    <th>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>불러오는 중</td></tr>
                  ) : list.items.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>데이터 없음</td></tr>
                  ) : (
                    list.items.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>{r.type || ""}</td>
                        <td>{r.answer || "-"}</td>
                        <td>
                          {r.result === "correct" && <span style={{ color: "#16a34a" }}>정답</span>}
                          {r.result === "wrong" && <span style={{ color: "#ef4444" }}>오답</span>}
                          {r.result === "unsolved" && <span style={{ color: "#6b7280" }}>미풀이</span>}
                        </td>
                        <td className="right">{r.pnl ?? "-"}</td>
                        <td>{r.note ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </StyledTable>

              <Row style={{ marginTop: 12 }}>
                <Muted>
                  총 {list.total}건 • {list.page}/{Math.max(1, Math.ceil(list.total / list.size))} 페이지
                </Muted>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => setPage(1)} disabled={list.page <= 1}>처음</Button>
                  <Button onClick={() => setPage(list.page - 1)} disabled={list.page <= 1}>이전</Button>
                  <Button onClick={() => setPage(list.page + 1)} disabled={list.page >= Math.ceil(list.total / list.size)}>다음</Button>
                  <Button onClick={() => setPage(Math.max(1, Math.ceil(list.total / list.size)))} disabled={list.page >= Math.ceil(list.total / list.size)}>마지막</Button>
                </div>
              </Row>

              {err && <div style={{ marginTop: 8, color: "#dc2626", fontSize: 13 }}>{err}</div>}
            </CardBody>
          </Card>
        </div>

        {/* Right: pie + insight */}
        <div>
          <Card>
            <CardHeader>
              <div>정답/오답/미풀이</div>
              <Small>정확도 {fmt(accuracyPct)}%</Small>
            </CardHeader>
            <CardBody>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={pieData} innerRadius={60} outerRadius={90} label>
                      {pieData.map((entry, index) => (
                        <Cell key={`c-${entry.key}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}건`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <CardHeader>통계 요약</CardHeader>
            <CardBody>
              <div style={{ whiteSpace: "pre-wrap", color: "#334155", fontSize: 14 }}>
                {loading && !insight ? "분석 중" : insight || "요약 코멘트 없음"}
              </div>
            </CardBody>
          </Card>
        </div>
      </MainGrid>
    </Page>
  );
}
