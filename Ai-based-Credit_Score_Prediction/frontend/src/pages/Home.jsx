import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie,
} from "recharts";
import FooterBrand from "../components/FooterBrand";

const API = "http://localhost:8000/api/v1";

const BAND_COLORS  = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444" };
const BAND_LABELS  = { A: "Excellent", B: "Good", C: "Fair", D: "Poor" };
const UTYPE_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444"];

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill || "#fff" }}>
          {p.name}: {typeof p.value === "number" ? p.value : p.value}
        </div>
      ))}
    </div>
  );
};

function SectionHeader({ tag, title, sub }) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/60 border border-gray-700/60 text-gray-500 text-xs font-mono tracking-widest mb-3">
        {tag}
      </div>
      <h2 className="text-3xl font-black">{title}</h2>
      {sub && <p className="text-gray-500 text-sm mt-1 font-mono">{sub}</p>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  /* Live data from backend */
  const [dashStats,    setDashStats]    = useState(null);
  const [bandDist,     setBandDist]     = useState(null);
  const [ageScore,     setAgeScore]     = useState(null);
  const [userTypeStat, setUserTypeStat] = useState(null);
  const [scoreDist,    setScoreDist]    = useState(null);
  const [vintageScore, setVintageScore] = useState(null);
  const [kycImpact,    setKycImpact]    = useState(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const [ds, bd, as_, ut, sd, vs, kyc] = await Promise.allSettled([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/analytics/band-distribution`),
        axios.get(`${API}/analytics/age-score`),
        axios.get(`${API}/analytics/user-type-breakdown`),
        axios.get(`${API}/analytics/score-distribution?bins=24`),
        axios.get(`${API}/analytics/vintage-score`),
        axios.get(`${API}/analytics/kyc-score-impact`),
      ]);
      if (ds.status  === "fulfilled") setDashStats(ds.value.data);
      if (bd.status  === "fulfilled") setBandDist(bd.value.data);
      if (as_.status === "fulfilled") setAgeScore(as_.value.data);
      if (ut.status  === "fulfilled") setUserTypeStat(ut.value.data);
      if (sd.status  === "fulfilled") setScoreDist(sd.value.data);
      if (vs.status  === "fulfilled") setVintageScore(vs.value.data);
      if (kyc.status === "fulfilled") setKycImpact(kyc.value.data);
      setLoading(false);
    };
    load();
  }, []);

  /* derived chart data */
  const bandChartData = bandDist?.bands?.map((b) => ({
    band: b.band, label: BAND_LABELS[b.band], count: b.count, pct: b.pct, fill: BAND_COLORS[b.band],
  })) || [];

  const ageChartData = ageScore
    ? ageScore.labels.map((l, i) => ({ age: l, avg: ageScore.avg_scores[i], count: ageScore.counts[i] }))
    : [];

  const userTypeData = userTypeStat?.user_type_stats?.map((u, i) => ({
    name: u.user_type.replace(/_/g, " "), avg: u.avg_score,
    A: u.band_A_pct, B: u.band_B_pct, C: u.band_C_pct, D: u.band_D_pct,
    fill: UTYPE_COLORS[i],
  })) || [];

  const scoreHistData = scoreDist
    ? scoreDist.labels.map((l, i) => ({ range: l, count: scoreDist.counts[i] }))
    : [];

  const vintageData = vintageScore
    ? vintageScore.labels.map((l, i) => ({ vintage: l, score: vintageScore.avg_scores[i] }))
    : [];

  const kycData = kycImpact
    ? kycImpact.bins.map((b, i) => ({ bin: b, score: kycImpact.avg_scores[i] }))
    : [];

  return (
    <div className="text-white overflow-hidden">

      {/* ══ HERO ══ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[320px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative z-10 max-w-4xl mx-auto transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(28px)" }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            ALTERNATE CREDIT SCORING ENGINE · INDIA
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Know Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Credit Intelligence
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            AI-powered scoring on real transaction data — not just credit history.
            GMM imputation + XGBoost on 60+ behavioral features.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/predict")}
              className="px-9 py-4 rounded-xl font-bold text-base tracking-wide hover:scale-105 active:scale-95 transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 32px rgba(59,130,246,0.3)" }}
            >
              Analyze a User →
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-9 py-4 rounded-xl font-bold text-base tracking-wide bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-600 transition-all duration-200"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* ══ LIVE KPI STRIP ══ */}
      <section className="border-y border-gray-800/60 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: "Total Users",    value: dashStats ? `${(dashStats.total_users / 1000).toFixed(0)}K` : "—", accent: "#3b82f6" },
            { label: "Avg Score",      value: dashStats ? Math.round(dashStats.avg_credit_score) : "—",           accent: "#10b981" },
            { label: "Median Score",   value: dashStats ? Math.round(dashStats.median_score) : "—",               accent: "#8b5cf6" },
            { label: "Auto Approve",   value: dashStats ? `${dashStats.auto_approve_pct.toFixed(1)}%` : "—",      accent: "#10b981" },
            { label: "Model MAE",      value: dashStats?.model_mae ? `±${dashStats.model_mae}` : "—",             accent: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black tabular-nums" style={{ color: s.accent }}>
                {loading ? <span className="text-gray-700">···</span> : s.value}
              </div>
              <div className="text-xs font-mono text-gray-500 tracking-widest uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BAND DISTRIBUTION ══ */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <SectionHeader tag="RISK BANDS" title="Portfolio Breakdown" sub="Live risk band distribution from the dataset" />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Band Distribution</div>
            {bandChartData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={bandChartData} dataKey="count" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {bandChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} formatter={(v) => [v.toLocaleString(), "Users"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {bandChartData.map((b) => (
                    <div key={b.band} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.fill }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span style={{ color: b.fill }}>{b.band} — {b.label}</span>
                          <span className="text-gray-400">{b.pct}%</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.fill }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>

          {/* Score histogram */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Score Histogram</div>
            {scoreDist && (
              <div className="text-xs text-gray-600 font-mono mb-3">
                μ={scoreDist.mean} · σ={scoreDist.std} · n={scoreDist.total?.toLocaleString()}
              </div>
            )}
            {scoreHistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreHistData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis dataKey="range" tick={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={36} />
                  <Tooltip content={<DarkTooltip />} formatter={(v) => [v.toLocaleString(), "Users"]} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {scoreHistData.map((entry, i) => {
                      const [lo] = entry.range.split("–").map(Number);
                      const color = lo >= 750 ? "#10b981" : lo >= 650 ? "#3b82f6" : lo >= 550 ? "#f59e0b" : "#ef4444";
                      return <Cell key={i} fill={color} opacity={0.7} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>
        </div>
      </section>

      {/* ══ DECISION FUNNEL ══ */}
      {dashStats && (
        <section className="py-6 px-6 max-w-6xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-5">Loan Decision Funnel · Entire Portfolio</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "AUTO APPROVE",      value: dashStats.auto_approve_pct,  color: "#10b981" },
                { label: "MANUAL REVIEW",     value: dashStats.manual_review_pct, color: "#f59e0b" },
                { label: "REJECT",            value: dashStats.reject_pct,        color: "#ef4444" },
                { label: "MODEL R²",          value: dashStats.model_r2 ? `${(dashStats.model_r2 * 100).toFixed(1)}%` : "—", color: "#8b5cf6", raw: true },
              ].map((d) => (
                <div key={d.label} className="relative bg-gray-800/40 rounded-xl p-4 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${d.color}55, transparent)` }} />
                  <div className="text-2xl font-black tabular-nums" style={{ color: d.color }}>
                    {d.raw ? d.value : `${d.value?.toFixed(1)}%`}
                  </div>
                  <div className="text-xs font-mono text-gray-500 tracking-widest mt-1">{d.label}</div>
                  {!d.raw && (
                    <div className="h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ AGE vs SCORE + USER TYPE ══ */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <SectionHeader tag="DEMOGRAPHICS" title="Score by Demographics" sub="How age group and employment type affect credit scores" />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Age vs Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Average Score by Age Group</div>
            <p className="text-xs text-gray-600 font-mono mb-4">Older users tend to show higher credit reliability</p>
            {ageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageChartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="age" tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }} />
                  <YAxis domain={[500, 800]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={40} />
                  <Tooltip content={<DarkTooltip />} formatter={(v) => [v, "Avg Score"]} />
                  <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                    {ageChartData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${200 + i * 8}, 70%, 55%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>

          {/* User type avg score */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Avg Score by Employment Type</div>
            <p className="text-xs text-gray-600 font-mono mb-4">Salaried govt employees typically score highest</p>
            {userTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={userTypeData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[500, 800]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} />
                  <YAxis dataKey="name" type="category"
                    tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }} width={100} />
                  <Tooltip content={<DarkTooltip />} formatter={(v) => [v, "Avg Score"]} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {userTypeData.map((entry, i) => (
                      <Cell key={i} fill={UTYPE_COLORS[i]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>
        </div>
      </section>

      {/* ══ VINTAGE + KYC ══ */}
      <section className="py-6 px-6 max-w-6xl mx-auto">
        <SectionHeader tag="BEHAVIORAL INSIGHTS" title="Account History & KYC Impact" sub="Longer banking history and complete KYC → better scores" />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Vintage */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">Account Vintage vs Score</div>
            <p className="text-xs text-gray-600 font-mono mb-4">Longer account history shows stronger financial consistency</p>
            {vintageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={vintageData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="vintage" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={40} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ fill: "#3b82f6", r: 4 }} name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>

          {/* KYC completeness */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">KYC Completeness vs Score</div>
            <p className="text-xs text-gray-600 font-mono mb-4">Higher KYC score means better data and higher predicted score</p>
            {kycData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={kycData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="bin" tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={40} />
                  <Tooltip content={<DarkTooltip />} formatter={(v) => [v, "Avg Score"]} />
                  <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                    {kycData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${140 + i * 15}, 65%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-700 font-mono text-xs">Loading...</div>
            )}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-24 px-6 text-center max-w-6xl mx-auto">
        <div className="rounded-2xl p-12 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.07), rgba(6,182,212,0.05))", border: "1px solid rgba(59,130,246,0.18)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center top, rgba(59,130,246,0.09), transparent 70%)" }} />
          <h2 className="text-3xl font-black mb-3 relative">Ready to Score a User?</h2>
          <p className="text-gray-400 mb-8 relative text-sm">
            Enter any User ID and get full AI credit intelligence — score, cluster, dimensions, factors, and charts.
          </p>
          <button
            onClick={() => navigate("/predict")}
            className="px-10 py-4 rounded-xl font-bold text-base tracking-wide hover:scale-105 active:scale-95 transition-all duration-200 relative"
            style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 32px rgba(59,130,246,0.3)" }}
          >
            Open Score Engine →
          </button>
        </div>
      </section>
      {/* <FooterBrand/> */}
    </div>
  );
}
