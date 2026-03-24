import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, CartesianGrid,
} from "recharts";

const API = "http://localhost:8000/api/v1";

const BAND_CONFIG = {
  A: { color: "#10b981", glow: "rgba(16,185,129,0.3)", label: "Excellent" },
  B: { color: "#3b82f6", glow: "rgba(59,130,246,0.3)", label: "Good" },
  C: { color: "#f59e0b", glow: "rgba(109, 93, 66, 0.3)", label: "Fair" },
  D: { color: "#ef4444", glow: "rgba(239,68,68,0.3)",  label: "Poor" },
};

const DECISION_CONFIG = {
  AUTO_APPROVE:        { icon: "✦", label: "Auto Approved",        bg: "#052e16", border: "#10b981", text: "#10b981" },
  APPROVE_LOWER_LIMIT: { icon: "◈", label: "Approved · Low Limit", bg: "#0c1a3a", border: "#3b82f6", text: "#3b82f6" },
  MANUAL_REVIEW:       { icon: "◉", label: "Manual Review",        bg: "#2d1a00", border: "#f59e0b", text: "#f59e0b" },
  REJECT:              { icon: "✕", label: "Rejected",             bg: "#2d0a0a", border: "#ef4444", text: "#ef4444" },
};

const CLUSTER_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444"];

/* ── Animated gauge ─────────────────────────────── */
function ScoreGauge({ score, band }) {
  const cfg = BAND_CONFIG[band] || BAND_CONFIG.D;
  const pct = ((score - 300) / 600) * 100;
  const [displayed, setDisplayed] = useState(300);
  const [arcPct, setArcPct] = useState(0);

  useEffect(() => {
    let start = null;
    const raf = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(300 + (score - 300) * ease));
      setArcPct(pct * ease);
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score, pct]);

  const R = 88, cx = 110, cy = 110;
  const sa = Math.PI * 0.75, ea = Math.PI * 2.25;
  const ta = ea - sa;
  const arcEnd = sa + (ta * arcPct) / 100;
  const toXY = (a) => ({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  const s = toXY(sa), e = toXY(arcEnd), trackEnd = toXY(ea);
  const large = arcPct > 50 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="180" viewBox="0 0 220 190">
        <defs>
          <linearGradient id={`ag-${band}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={cfg.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={cfg.color} />
          </linearGradient>
          <filter id="glw">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none" stroke="#1f2937" strokeWidth="12" strokeLinecap="round" />
        {arcPct > 0 && (
          <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`}
            fill="none" stroke={`url(#ag-${band})`} strokeWidth="12" strokeLinecap="round" filter="url(#glw)" />
        )}
        {arcPct > 2 && <circle cx={e.x} cy={e.y} r="6" fill={cfg.color} filter="url(#glw)" />}
        <text x="28"  y="168" fill="#4b5563" fontSize="10" fontFamily="monospace">300</text>
        <text x="176" y="168" fill="#4b5563" fontSize="10" fontFamily="monospace">900</text>
      </svg>
      <div className="text-center -mt-8">
        <div style={{ fontSize: "3.5rem", fontWeight: 900, color: cfg.color,
          textShadow: `0 0 30px ${cfg.glow}`, lineHeight: 1 }}>
          {displayed}
        </div>
        <div style={{ color: cfg.color }} className="text-xs tracking-[0.2em] uppercase mt-1">
          {cfg.label}
        </div>
      </div>
    </div>
  );
}

function DimBar({ label, value }) {
  const [w, setW] = useState(0);
  const pct = Math.round(value);
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#3b82f6" : pct >= 30 ? "#f59e0b" : "#ef4444";
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-mono text-gray-400">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${w}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
      </div>
    </div>
  );
}

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill || "#fff" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed ? p.value.toFixed(2) : p.value : p.value}
        </div>
      ))}
    </div>
  );
};

export default function Predict() {
  const [userId, setUserId]   = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [focused, setFocused] = useState(false);

  const [featureImportance, setFeatureImportance] = useState(null);
  const [scoreDistribution, setScoreDistribution] = useState(null);
  const [emiImpact,         setEmiImpact]         = useState(null);
  const [savingsCorr,       setSavingsCorr]       = useState(null);
  const [spendBreakdown,    setSpendBreakdown]    = useState(null);

  const band   = result?.risk_band;
  const cfg    = band ? BAND_CONFIG[band] : null;
  const decCfg = result ? DECISION_CONFIG[result.loan_decision] : null;
  const topCluster = result
    ? Object.entries(result.cluster_membership).sort((a, b) => b[1] - a[1])[0]
    : null;

  const fetchScore = async () => {
    if (!userId.trim()) return;
    setLoading(true); setError(null); setResult(null);
    setFeatureImportance(null); setScoreDistribution(null);
    setEmiImpact(null); setSavingsCorr(null); setSpendBreakdown(null);
    try {
      const res = await axios.get(`${API}/predict/user/${userId}`);
      setResult(res.data);
      const [fi, sd, emi, sav, spnd] = await Promise.allSettled([
        axios.get(`${API}/analytics/feature-importance?top_n=12`),
        axios.get(`${API}/analytics/score-distribution?bins=20`),
        axios.get(`${API}/analytics/emi-bounce-impact`),
        axios.get(`${API}/analytics/savings-score-correlation`),
        axios.get(`${API}/analytics/spend-breakdown`),
      ]);
      if (fi.status   === "fulfilled") setFeatureImportance(fi.value.data);
      if (sd.status   === "fulfilled") setScoreDistribution(sd.value.data);
      if (emi.status  === "fulfilled") setEmiImpact(emi.value.data);
      if (sav.status  === "fulfilled") setSavingsCorr(sav.value.data);
      if (spnd.status === "fulfilled") setSpendBreakdown(spnd.value.data);
    } catch {
      setError("User not found. Try IDs like 90001, 90042, 12345.");
    } finally {
      setLoading(false);
    }
  };

  const radarData = result
    ? Object.entries(result.dimension_scores).map(([k, v]) => ({ subject: k, value: v }))
    : [];

  const clusterData = result
    ? Object.entries(result.cluster_membership)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v], i) => ({ name: k.replace("Cluster_", "C"), prob: parseFloat((v * 100).toFixed(2)), fill: CLUSTER_COLORS[i] }))
    : [];

  const featureData = featureImportance
    ? featureImportance.features.slice(0, 12).map((f, i) => ({
        name: f.replace(/_/g, " ").slice(0, 24),
        value: parseFloat(featureImportance.importances[i].toFixed(5)),
      }))
    : [];

  const distData = scoreDistribution
    ? scoreDistribution.labels.map((l, i) => ({ range: l, count: scoreDistribution.counts[i] }))
    : [];

  const emiData = emiImpact
    ? emiImpact.bounce_counts.map((b, i) => ({ bounces: b, avg_score: emiImpact.avg_scores[i] }))
    : [];

  const savData = savingsCorr
    ? savingsCorr.bins.slice(0, 14).map((b, i) => ({
        bin: parseFloat(b.replace("(", "").split(",")[0]).toFixed(2),
        score: savingsCorr.avg_scores[i],
      }))
    : [];

  const spendData = spendBreakdown && band && spendBreakdown.band_data?.[band]
    ? spendBreakdown.labels.map((l, i) => ({
        category: l,
        value: parseFloat((spendBreakdown.band_data[band].values[i] * 100).toFixed(2)),
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-black text-sm tracking-tight">
            <span className="text-gray-500">DARCRAYS</span>
            <span className="text-gray-700 mx-2">/</span>
            <span>Score Engine</span>
          </div>
          <div className="text-xs font-mono text-gray-600 tracking-widest hidden md:block">
            GMM IMPUTATION · XGBOOST · 60+ FEATURES
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Search ── */}
        <div
          className="relative bg-gray-900 rounded-2xl border transition-all duration-300 overflow-hidden"
          style={{ borderColor: focused ? (cfg?.color || "#3b82f6") : "#1f2937" }}
        >
          {focused && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{ background: `radial-gradient(ellipse at top, ${cfg?.color || "#3b82f6"}, transparent 70%)` }} />
          )}
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="text-gray-600 font-mono text-lg">#</span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchScore()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter User ID  (e.g. 90001, 12345, 55000)"
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm font-mono outline-none"
            />
            <button
              onClick={fetchScore}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all duration-200 disabled:opacity-40 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${cfg?.color || "#3b82f6"}22, ${cfg?.color || "#3b82f6"}44)`,
                border: `1px solid ${cfg?.color || "#3b82f6"}55`,
                color: cfg?.color || "#3b82f6",
              }}
            >
              {loading ? "SCORING..." : "ANALYZE →"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 text-red-400 font-mono text-sm">
            ✕ {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-600 font-mono text-xs tracking-widest">RUNNING GMM + XGBOOST MODEL...</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-6">

            {/* ═══ ROW 1: Gauge | Decision | Stats ═══ */}
            <div className="grid md:grid-cols-3 gap-5">
              {/* Gauge */}
              <div className="relative bg-gray-900 rounded-2xl border p-6 flex flex-col items-center justify-center overflow-hidden"
                style={{ borderColor: cfg.color + "44" }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at center, ${cfg.glow} 0%, transparent 65%)` }} />
                <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-1">Credit Score</div>
                <ScoreGauge score={result.credit_score} band={band} />
                <div className="text-xs font-mono text-gray-500 mt-2">
                  Band <span style={{ color: cfg.color }}>{band}</span> · {result.risk_band_label}
                </div>
              </div>

              {/* Decision card */}
              <div className="relative rounded-2xl border p-6 flex flex-col justify-between overflow-hidden"
                style={{ background: decCfg.bg, borderColor: decCfg.border }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${decCfg.border}88, transparent)` }} />
                <div>
                  <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-4">Loan Decision</div>
                  <div className="text-5xl font-black mb-3" style={{ color: decCfg.text }}>{decCfg.icon}</div>
                  <div className="text-lg font-bold" style={{ color: decCfg.text }}>{decCfg.label}</div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">SCORE PERCENTILE</span>
                    <span style={{ color: cfg.color }}>{result.score_percentile}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${result.score_percentile}%`, backgroundColor: cfg.color }} />
                  </div>
                  <div className="text-xs text-gray-600 font-mono">Better than {result.score_percentile}% of all users</div>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-rows-3 gap-3">
                {[
                  { label: "Data Completeness", value: `${result.completeness_pct}%`, sub: `${result.features_provided} features provided`, accent: cfg.color },
                  { label: "GMM Imputed Fields", value: result.imputed_count,         sub: "auto-filled by GMM model",                     accent: "#8b5cf6" },
                  { label: "Risk Band",          value: band,                         sub: result.risk_band_label,                          accent: cfg.color },
                ].map((s) => (
                  <div key={s.label} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-hidden hover:border-gray-700 transition-colors">
                    <div className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${s.accent}55, transparent)` }} />
                    <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">{s.label}</div>
                    <div className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</div>
                    <div className="text-xs text-gray-600 font-mono mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ ROW 2: Radar + Factors + Imputed Tags ═══ */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Radar chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Financial Dimensions Radar</h3>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">7-axis behavioral profile</p>
                  </div>
                  <span className="text-xs font-mono text-gray-600">/ 100</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#1f2937" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke={cfg.color} fill={cfg.color} fillOpacity={0.15} strokeWidth={2}
                      dot={{ fill: cfg.color, r: 3 }} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {Object.entries(result.dimension_scores).map(([k, v]) => (
                    <DimBar key={k} label={k} value={v} />
                  ))}
                </div>
              </div>

              {/* Factors + Imputed */}
              <div className="space-y-4">
                <div className="bg-gray-900 border border-emerald-900/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-bold tracking-widest uppercase text-emerald-400">Top Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(result.top_positive_factors).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 text-xs">↑</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono text-gray-300 truncate">{k}</div>
                          <div className="text-xs text-emerald-500/60">{Math.round(v)}/100</div>
                        </div>
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(v)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-red-900/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <h3 className="text-xs font-bold tracking-widest uppercase text-red-400">Weak Areas</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(result.top_negative_factors).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 text-xs">↓</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-mono text-gray-300 truncate">{k}</div>
                          <div className="text-xs text-red-500/60">{Math.round(v)}/100</div>
                        </div>
                        <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.round(v)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.imputed_count > 0 && (
                  <div className="bg-gray-900 border border-purple-900/40 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <h3 className="text-xs font-bold tracking-widest uppercase text-purple-400">
                        GMM Auto-Imputed ({result.imputed_count} fields)
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.imputed_features.map((f) => (
                        <span key={f} className="text-xs font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-md px-2 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3 font-mono">Missing fields filled via Gaussian Mixture Model cluster inference.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ ROW 3: GMM Cluster Analysis ═══ */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">GMM Cluster Membership Probabilities</h3>
                  <p className="text-xs text-gray-600 font-mono mt-1">
                    GMM assigns soft membership across {clusterData.length} behavioral archetypes. Your financial behavior matches each cluster with this probability.
                  </p>
                </div>
                {topCluster && (
                  <div className="text-right shrink-0 ml-6">
                    <div className="text-xs font-mono text-gray-500">Primary Archetype</div>
                    <div className="text-sm font-black mt-0.5" style={{ color: CLUSTER_COLORS[0] }}>
                      {topCluster[0]} · {(topCluster[1] * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={clusterData} layout="vertical" margin={{ left: 10, right: 24, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }}
                      tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }} width={28} />
                    <Tooltip content={<DarkTooltip />} formatter={(v) => [`${v}%`, "Probability"]} />
                    <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
                      {clusterData.map((entry, i) => (
                        <Cell key={i} fill={CLUSTER_COLORS[i]} opacity={i === 0 ? 1 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {clusterData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3 bg-gray-800/40 rounded-xl p-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-gray-300">Cluster {c.name}</span>
                          <span className="text-xs font-black tabular-nums" style={{ color: c.fill }}>{c.prob}%</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.prob}%`, backgroundColor: c.fill }} />
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md border shrink-0"
                          style={{ color: c.fill, borderColor: c.fill + "44", backgroundColor: c.fill + "11" }}>
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ ROW 4: Score Distribution Histogram ═══ */}
            {scoreDistribution && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Population Score Distribution</h3>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      Your score vs {scoreDistribution.total.toLocaleString()} users · Mean: {scoreDistribution.mean} · Median: {scoreDistribution.median} · σ: {scoreDistribution.std}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono text-gray-500">Your position</div>
                    <div className="text-lg font-black" style={{ color: cfg.color }}>{result.credit_score}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={distData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <XAxis dataKey="range" tick={false} />
                    <YAxis tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={36} />
                    <Tooltip content={<DarkTooltip />} formatter={(v) => [v, "Users"]} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {distData.map((entry, i) => {
                        const [lo] = entry.range.split("–").map(Number);
                        const hi  = lo + 30;
                        const inBand = result.credit_score >= lo && result.credit_score <= hi;
                        return <Cell key={i} fill={inBand ? cfg.color : "#1f2937"} opacity={inBand ? 1 : 0.75} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 text-xs font-mono text-gray-500">
                  <span>Min: {scoreDistribution.min}</span>
                  <span>·</span>
                  <span>Median: {scoreDistribution.median}</span>
                  <span>·</span>
                  <span>Mean: {scoreDistribution.mean}</span>
                  <span>·</span>
                  <span>Max: {scoreDistribution.max}</span>
                  <span className="ml-auto" style={{ color: cfg.color }}>▪ Your bin</span>
                </div>
              </div>
            )}

            {/* ═══ ROW 5: Feature Importance + Spend Breakdown ═══ */}
            <div className="grid md:grid-cols-2 gap-5">
              {featureData.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">XGBoost Feature Importance</h3>
                    <p className="text-xs text-gray-600 font-mono mt-1">Top 12 features that drive the model's credit score prediction</p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={featureData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fill: "#4b5563", fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis dataKey="name" type="category"
                        tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }} width={148} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="value" fill={cfg.color} radius={[0, 3, 3, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {spendData.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Spend Category Profile</h3>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      Average spend ratios for Band {band} ({result.risk_band_label}) users in the dataset
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={spendData} margin={{ left: 0, right: 10, top: 0, bottom: 32 }}>
                      <XAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                        angle={-20} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }}
                        tickFormatter={(v) => `${v}%`} width={36} />
                      <Tooltip content={<DarkTooltip />} formatter={(v) => [`${v}%`, "Spend Ratio"]} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {spendData.map((_, i) => (
                          <Cell key={i} fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ═══ ROW 6: EMI Impact + Savings Correlation ═══ */}
            <div className="grid md:grid-cols-2 gap-5">
              {emiData.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">EMI Bounce → Score Impact</h3>
                    <p className="text-xs text-gray-600 font-mono mt-1">How bounce count drags down average credit score across the dataset</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={emiData} margin={{ left: 0, right: 10, top: 5, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="bounces" tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                        label={{ value: "EMI Bounces", position: "insideBottom", fill: "#4b5563", fontSize: 10, dy: 12 }} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={40} />
                      <Tooltip content={<DarkTooltip />} />
                      <Line type="monotone" dataKey="avg_score" stroke="#ef4444" strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 3 }} name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-gray-600 font-mono">Each additional EMI bounce costs ~15–30 score points on average.</p>
                </div>
              )}

              {savData.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400">Savings Rate → Score Correlation</h3>
                    <p className="text-xs text-gray-600 font-mono mt-1">Higher net savings rate consistently correlates with higher credit scores</p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={savData} margin={{ left: 0, right: 10, top: 5, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="bin" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "monospace" }} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: "#4b5563", fontSize: 10, fontFamily: "monospace" }} width={40} />
                      <Tooltip content={<DarkTooltip />} />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2}
                        dot={{ fill: "#10b981", r: 3 }} name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-2 text-xs text-gray-600 font-mono">Savings rate is the #2 predictor. Even a 5% increase yields measurable gains.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-2xl text-gray-600">◈</div>
            <p className="text-gray-600 font-mono text-xs tracking-widest">ENTER A USER ID TO BEGIN</p>
            <p className="text-gray-700 text-xs font-mono">Try: 90001 · 12345 · 55000 · 77890</p>
          </div>
        )}
      </div>
    </div>
  );
}
