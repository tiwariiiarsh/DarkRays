import { useEffect, useState } from "react";

const TIMELINE = [
  {
    phase: "01",
    title: "Data Ingestion",
    desc: "60+ behavioral features extracted from raw bank transaction histories — UPI flows, EMI patterns, ATM usage, salary credits.",
    accent: "#3b82f6",
  },
  {
    phase: "02",
    title: "GMM Imputation",
    desc: "Gaussian Mixture Models fill missing features using cluster-aware probabilistic inference — no data point is discarded.",
    accent: "#8b5cf6",
  },
  {
    phase: "03",
    title: "XGBoost Scoring",
    desc: "Gradient boosted trees trained on 1 lakh labeled profiles output a raw score, calibrated to the 300–900 CIBIL range.",
    accent: "#06b6d4",
  },
  {
    phase: "04",
    title: "Decision Engine",
    desc: "Risk bands A–D trigger structured loan decisions — AUTO_APPROVE, APPROVE_LOWER_LIMIT, MANUAL_REVIEW, or REJECT.",
    accent: "#10b981",
  },
];

const DIMENSIONS = [
  { label: "Income Stability",    icon: "↗", color: "#3b82f6" },
  { label: "Balance Behaviour",   icon: "◈", color: "#8b5cf6" },
  { label: "Spending Discipline", icon: "◉", color: "#06b6d4" },
  { label: "EMI Repayment",       icon: "⬡", color: "#10b981" },
  { label: "Bill Payments",       icon: "▣", color: "#f59e0b" },
  { label: "Savings Rate",        icon: "⬟", color: "#ec4899" },
  { label: "BNPL Behaviour",      icon: "◫", color: "#ef4444" },
];

const TEAM = [
  {
    name: "Darcrays AI",
    role: "Core ML Engine",
    desc: "GMM imputation + XGBoost scoring pipeline",
    avatar: "◈",
    color: "#3b82f6",
  },
  {
    name: "FastAPI Backend",
    role: "REST API Layer",
    desc: "Real-time prediction, analytics & batch endpoints",
    avatar: "⬡",
    color: "#10b981",
  },
  {
    name: "React Frontend",
    role: "Intelligence Dashboard",
    desc: "Animated scoring UI with live cluster analysis",
    avatar: "◉",
    color: "#8b5cf6",
  },
];

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="text-white overflow-hidden">

      {/* ── HERO ── */}
      <section className="relative py-28 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div
          className="relative z-10 max-w-3xl mx-auto transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            ABOUT THE PLATFORM
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            Credit Scoring
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            DARCRAYS is an alternate credit intelligence engine that evaluates financial 
            behavior through 60+ transaction features — not just your credit history. 
            Built for India's underserved credit market.
          </p>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-4">The Problem</div>
            <h2 className="text-3xl font-black mb-5 leading-tight">Traditional scoring leaves millions behind</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Over 40 crore Indians are "credit invisible" — no CIBIL score, no credit card history, 
              no formal loan record. Traditional models simply cannot serve them.
            </p>
            <p className="text-gray-400 leading-relaxed">
              DARCRAYS uses real transaction behavior — how you spend, save, pay bills, 
              and manage EMIs — to build a complete financial picture, even with zero credit history.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { label: "Credit Invisible Indians",    value: "40Cr+", color: "#ef4444" },
              { label: "Features Analyzed",           value: "60+",   color: "#3b82f6" },
              { label: "Training Dataset Size",       value: "1L",    color: "#10b981" },
              { label: "Prediction Latency",          value: "~300ms",color: "#8b5cf6" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="text-2xl font-black tabular-nums w-24 shrink-0" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm text-gray-400 font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3">The Pipeline</div>
          <h2 className="text-3xl font-black">How DARCRAYS Works</h2>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent hidden md:block" />

          <div className="space-y-6">
            {TIMELINE.map((step, i) => (
              <div
                key={step.phase}
                className="relative flex gap-6 group transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Phase dot */}
                <div
                  className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ backgroundColor: step.accent + "18", border: `1px solid ${step.accent}40`, color: step.accent }}
                >
                  {step.phase}
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 group-hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-white">{step.title}</h3>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${step.accent}40, transparent)` }} />
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIMENSIONS ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3">Scoring Dimensions</div>
          <h2 className="text-3xl font-black">7 Financial Lenses</h2>
          <p className="text-gray-500 text-sm mt-2">Every user is evaluated across these behavioral dimensions</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DIMENSIONS.map((d) => (
            <div
              key={d.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 hover:border-gray-700 transition-colors group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: d.color + "18", color: d.color }}
              >
                {d.icon}
              </div>
              <span className="text-xs font-mono text-gray-400 leading-tight">{d.label}</span>
            </div>
          ))}
          {/* Extra card for "& More" */}
          <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-600 shrink-0">+</div>
            <span className="text-xs font-mono text-gray-600">53 more features</span>
          </div>
        </div>
      </section>

      {/* ── STACK ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-3">Tech Stack</div>
          <h2 className="text-3xl font-black">Built With</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TEAM.map((t) => (
            <div
              key={t.name}
              className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-200 group overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${t.color}66, transparent)` }} />
              <div
                className="text-3xl mb-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: t.color + "15", border: `1px solid ${t.color}30`, color: t.color }}
              >
                {t.avatar}
              </div>
              <div className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-1">{t.role}</div>
              <h3 className="font-bold text-white mb-2">{t.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}