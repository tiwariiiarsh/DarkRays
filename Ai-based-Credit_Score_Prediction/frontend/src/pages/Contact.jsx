import { useState, useEffect } from "react";

const CONTACT_ITEMS = [
  {
    icon: "✉",
    label: "Email",
    value: "support@darcrays.com",
    sub: "We respond within 24 hours",
    accent: "#3b82f6",
    href: "mailto:support@darcrays.com",
  },
  {
    icon: "◎",
    label: "Phone",
    value: "+91 98765 43210",
    sub: "Mon–Fri, 10AM–6PM IST",
    accent: "#10b981",
    href: "tel:+919876543210",
  },
  {
    icon: "⬡",
    label: "Location",
    value: "India",
    sub: "Remote-first · Pan-India coverage",
    accent: "#8b5cf6",
    href: null,
  },
  {
    icon: "◈",
    label: "API Docs",
    value: "localhost:8000/docs",
    sub: "FastAPI Swagger UI",
    accent: "#f59e0b",
    href: "http://localhost:8000/docs",
  },
];

const FAQS = [
  {
    q: "What data does DARCRAYS use to score me?",
    a: "We analyze 60+ behavioral features extracted from bank transaction history — salary credits, EMI patterns, UPI flows, utility payments, savings rate, and more. No traditional credit bureau data required.",
  },
  {
    q: "How accurate is the score?",
    a: "Our XGBoost model achieves ~94% band accuracy on the 1 lakh user test set, with a mean absolute error under 15 points on the 300–900 scale.",
  },
  {
    q: "What if I have missing data?",
    a: "Missing features are intelligently imputed using Gaussian Mixture Models — the system scores you based on your behavioral cluster, not on gaps in your data.",
  },
  {
    q: "Can I score multiple users at once?",
    a: "Yes. The batch endpoint supports up to 500 users per JSON call, or 1000 rows via CSV upload through the /api/v1/batch/predict-csv endpoint.",
  },
];

export default function Contact() {
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="text-white overflow-hidden">

      {/* ── HERO ── */}
      <section className="relative py-24 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <div
          className="relative z-10 max-w-2xl mx-auto transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            GET IN TOUCH
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight mb-5">
            Let's
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Connect</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Questions about the API, the model, or integration? We're here.
          </p>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className="py-8 px-6 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CONTACT_ITEMS.map((c) => (
            <a
              key={c.label}
              href={c.href || undefined}
              target={c.href?.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="block bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-200 group cursor-pointer relative overflow-hidden"
              style={c.href ? {} : { cursor: "default" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${c.accent}55, transparent)` }} />
              <div
                className="text-lg w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110"
                style={{ backgroundColor: c.accent + "15", border: `1px solid ${c.accent}30`, color: c.accent }}
              >
                {c.icon}
              </div>
              <div className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-1">{c.label}</div>
              <div className="text-sm font-bold text-white break-all leading-tight">{c.value}</div>
              <div className="text-xs text-gray-600 mt-1">{c.sub}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── FORM + FAQ ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10">

          {/* ── MESSAGE FORM ── */}
          <div>
            <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6">Send a Message</div>

            {sent ? (
              <div className="flex flex-col items-center justify-center h-64 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-3">
                <div className="text-3xl text-emerald-400">✦</div>
                <p className="font-bold text-emerald-400">Message Sent!</p>
                <p className="text-gray-500 text-sm font-mono text-center px-6">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Name */}
                <div className="relative group">
                  <div className="text-xs font-mono text-gray-600 mb-1.5 tracking-wide">NAME</div>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <div className="text-xs font-mono text-gray-600 mb-1.5 tracking-wide">EMAIL</div>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    type="email"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="text-xs font-mono text-gray-600 mb-1.5 tracking-wide">MESSAGE</div>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what you're building or what you need help with..."
                    rows={5}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl font-bold text-sm tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #10b981, #06b6d4)",
                    boxShadow: "0 0 24px rgba(16,185,129,0.25)",
                  }}
                >
                  Send Message →
                </button>
              </div>
            )}
          </div>

          {/* ── FAQ ── */}
          <div>
            <div className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6">Frequently Asked</div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-700"
                >
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-semibold text-white leading-snug">{faq.q}</span>
                    <span
                      className="text-lg shrink-0 transition-transform duration-300 text-gray-500"
                      style={{ transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? "200px" : "0px" }}
                  >
                    <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── BOTTOM BAR ── */}
      <section className="py-10 px-6 max-w-5xl mx-auto">
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <div>
            <div className="font-bold text-white mb-1">Explore the API</div>
            <div className="text-gray-500 text-sm font-mono">Full Swagger docs available at localhost:8000/docs</div>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:scale-105 shrink-0"
            style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}
          >
            Open Docs →
          </a>
        </div>
      </section>

    </div>
  );
}