"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from "framer-motion";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE SVG ICONS  (replaces lucide-react — zero external deps)
───────────────────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 1.8, viewBox = "0 0 24 24", children }: {
  d?: string; size?: number; color?: string; strokeWidth?: number; viewBox?: string; children?: React.ReactNode;
}) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Users: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>,
  Wallet: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M20 12V8H6a2 2 0 0 1 0-4h14v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><circle cx="16" cy="14" r="1" fill="currentColor" /></Icon>,
  PieChart: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></Icon>,
  Zap: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Icon>,
  Shield: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
  ArrowRight: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>,
  Check: (p: { size?: number; color?: string; strokeWidth?: number }) => <Icon size={p.size} color={p.color} strokeWidth={p.strokeWidth}><polyline points="20 6 9 17 4 12" /></Icon>,
  Star: (p: { size?: number; color?: string; fill?: string }) => <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill={p.fill ?? "none"} stroke={p.color ?? "currentColor"} strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  ChevronRight: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><polyline points="9 18 15 12 9 6" /></Icon>,
  Receipt: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="12" y2="16" /></Icon>,
  TrendingUp: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Icon>,
  Bell: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Icon>,
  Menu: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></Icon>,
  X: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>,
  Sparkles: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" /><path d="M5 3L5.5 4.5H7L5.75 5.5L6.25 7L5 6.1L3.75 7L4.25 5.5L3 4.5H4.5L5 3Z" /><path d="M19 14L19.5 15.5H21L19.75 16.5L20.25 18L19 17.1L17.75 18L18.25 16.5L17 15.5H18.5L19 14Z" /></Icon>,
  Globe: (p: { size?: number; color?: string }) => <Icon size={p.size} color={p.color}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>,
};

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Geist+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Bricolage Grotesque', sans-serif;
  background: #020617;
  color: #e2e8f0;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #020617; }
::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 4px; }

/* grain overlay */
.sn2-grain::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  opacity: 0.4;
}

/* animated orbs */
.sn2-orb {
  position: absolute; border-radius: 50%;
  filter: blur(90px); pointer-events: none;
  animation: sn2Drift 18s ease-in-out infinite;
}
@keyframes sn2Drift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%     { transform: translate(60px,-80px) scale(1.12); }
  66%     { transform: translate(-40px,50px) scale(0.9); }
}

/* dot grid */
.sn2-grid-bg {
  background-image:
    linear-gradient(rgba(99,102,241,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,0.045) 1px, transparent 1px);
  background-size: 72px 72px;
}

/* glass card */
.sn2-card {
  position: relative;
  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 20px;
  backdrop-filter: blur(16px);
  transition: border-color .35s, box-shadow .35s, transform .35s;
}
.sn2-card::before {
  content: '';
  position: absolute; inset: 0; border-radius: 20px;
  background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.07), transparent 65%);
  opacity: 0; transition: opacity .35s; pointer-events: none;
}
.sn2-card:hover { border-color: rgba(99,102,241,0.4); box-shadow: 0 0 40px rgba(99,102,241,0.12), 0 20px 60px rgba(0,0,0,0.4); transform: translateY(-4px); }
.sn2-card:hover::before { opacity: 1; }

/* gradient texts */
.sn2-grad {
  background: linear-gradient(135deg,#818cf8 0%,#a855f7 45%,#ec4899 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sn2-grad-cyan {
  background: linear-gradient(135deg,#22d3ee,#818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sn2-logo-grad {
  background: linear-gradient(135deg,#e2e8f0,#a5b4fc);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* primary button */
.sn2-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 28px; border-radius: 12px; border: none;
  background: linear-gradient(135deg,#6366f1,#a855f7,#ec4899);
  background-size: 200% 100%;
  color: #fff; font-family: 'Bricolage Grotesque',sans-serif;
  font-size: .95rem; font-weight: 600; cursor: pointer;
  transition: background-position .4s, transform .2s, box-shadow .3s;
  box-shadow: 0 4px 30px rgba(99,102,241,0.4);
  letter-spacing: .01em;
}
.sn2-btn-primary:hover { background-position: 100% 0; transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 40px rgba(168,85,247,0.5); }

/* ghost button */
.sn2-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 22px; border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.25);
  background: rgba(99,102,241,0.06);
  color: #a5b4fc; font-family: 'Bricolage Grotesque',sans-serif;
  font-size: .95rem; font-weight: 500; cursor: pointer;
  transition: background .25s, border-color .25s, color .25s, transform .2s;
}
.sn2-btn-ghost:hover { background: rgba(99,102,241,0.14); border-color: rgba(99,102,241,0.5); color: #e0e7ff; transform: translateY(-1px); }

/* navbar */
.sn2-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  transition: background .4s, box-shadow .4s, border-color .4s;
}
.sn2-nav.sn2-scrolled {
  background: rgba(2,6,23,0.88);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(99,102,241,0.12);
  box-shadow: 0 4px 40px rgba(0,0,0,0.5);
}
.sn2-nav-link {
  color: #94a3b8; font-size: .9rem; font-weight: 500;
  text-decoration: none; transition: color .2s; position: relative;
}
.sn2-nav-link::after {
  content: ''; position: absolute; left: 0; bottom: -4px; right: 0; height: 1px;
  background: linear-gradient(90deg,#6366f1,#a855f7);
  transform: scaleX(0); transform-origin: left; transition: transform .25s;
}
.sn2-nav-link:hover { color: #e2e8f0; }
.sn2-nav-link:hover::after { transform: scaleX(1); }

/* hero animations */
@keyframes sn2FadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
.sn2-a0 { animation: sn2FadeUp .8s ease both; }
.sn2-a1 { animation: sn2FadeUp .8s .12s ease both; }
.sn2-a2 { animation: sn2FadeUp .8s .24s ease both; }
.sn2-a3 { animation: sn2FadeUp .8s .36s ease both; }
.sn2-a4 { animation: sn2FadeUp .8s .5s ease both; }

@keyframes sn2Pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
.sn2-pulse { animation: sn2Pulse 2.2s ease infinite; }

@keyframes sn2Float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.sn2-float { animation: sn2Float 5s ease-in-out infinite; }

/* scroll reveal */
.sn2-reveal { opacity:0; transform:translateY(28px); transition: opacity .7s ease, transform .7s ease; }
.sn2-reveal.sn2-vis { opacity:1; transform:translateY(0); }
.sn2-d1 { transition-delay:.1s; }
.sn2-d2 { transition-delay:.2s; }
.sn2-d3 { transition-delay:.3s; }

/* glow lines */
.sn2-glow-line {
  height:1px;
  background: linear-gradient(90deg,transparent,#6366f1,#a855f7,#ec4899,transparent);
  box-shadow: 0 0 12px rgba(99,102,241,0.5);
}
.sn2-divider {
  height:1px;
  background: linear-gradient(90deg,transparent,rgba(99,102,241,0.18),transparent);
  max-width:800px; margin:0 auto;
}

/* pricing featured card */
.sn2-featured {
  border-color: rgba(168,85,247,0.45) !important;
  box-shadow: 0 0 60px rgba(168,85,247,0.15), 0 0 0 1px rgba(168,85,247,0.25);
}

/* avatar stack */
.sn2-avatar {
  width:36px; height:36px; border-radius:50%;
  border:2px solid #020617;
  display:flex; align-items:center; justify-content:center;
  font-size:.72rem; font-weight:700; color:#fff;
  margin-left:-10px; flex-shrink:0;
}
.sn2-avatar:first-child { margin-left:0; }

/* section badge */
.sn2-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 14px; border-radius:100px;
  font-size:.75rem; font-weight:600;
  letter-spacing:.06em; text-transform:uppercase;
  margin-bottom:18px;
}

/* icon container */
.sn2-icon-box {
  width:52px; height:52px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  margin-bottom:20px; flex-shrink:0;
}

/* chip tag */
.sn2-chip {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 10px; border-radius:100px;
  font-size:.65rem; font-weight:700; letter-spacing:.05em;
  text-transform:uppercase;
}

/* hide cursor on mobile */
@media (hover: none) {
  body { cursor: auto; }
  a, button { cursor: pointer; }
}

/* responsive */
@media (max-width:768px) {
  .sn2-hide-mob { display:none !important; }
  .sn2-hero-h { font-size:clamp(2.2rem,9vw,3.4rem) !important; letter-spacing:-1.5px !important; }
  .sn2-feat-grid  { grid-template-columns:1fr !important; }
  .sn2-how-grid   { grid-template-columns:1fr !important; }
  .sn2-price-grid { grid-template-columns:1fr !important; }
  .sn2-foot-grid  { grid-template-columns:1fr !important; }
  .sn2-stat-grid  { grid-template-columns:1fr 1fr !important; }
  .sn2-mock-grid  { grid-template-columns:1fr !important; }
  #sn2-ham        { display:flex !important; }
}
`;

/* ─────────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { Icon: Icons.Users, label: "Smart Groups", col: "#6366f1", bg: "rgba(99,102,241,0.12)", glow: "rgba(99,102,241,0.3)", desc: "Create groups for trips, roommates, or events. Invite anyone with a link — no sign-up needed for guests." },
  { Icon: Icons.Receipt, label: "Instant Splits", col: "#a855f7", bg: "rgba(168,85,247,0.12)", glow: "rgba(168,85,247,0.3)", desc: "Add an expense in seconds. Split equally, by percentage, or custom amounts. SplitNest does the math." },
  { Icon: Icons.TrendingUp, label: "Live Balances", col: "#22d3ee", bg: "rgba(34,211,238,0.10)", glow: "rgba(34,211,238,0.3)", desc: "See live running balances for every member. No confusion about who paid what, ever." },
  { Icon: Icons.Zap, label: "Smart Settlements", col: "#ec4899", bg: "rgba(236,72,153,0.10)", glow: "rgba(236,72,153,0.3)", desc: "Our algorithm minimizes transactions. 12 payments become 3 — settle up fast and move on." },
  { Icon: Icons.Bell, label: "Gentle Reminders", col: "#818cf8", bg: "rgba(129,140,248,0.10)", glow: "rgba(129,140,248,0.3)", desc: "Automated nudges keep everyone accountable without the awkward conversation." },
  { Icon: Icons.Shield, label: "Bank-grade Security", col: "#34d399", bg: "rgba(52,211,153,0.10)", glow: "rgba(52,211,153,0.3)", desc: "End-to-end encrypted data. We never store payment details. Your finances stay private." },
];

const STEPS = [
  { n: "01", Icon: Icons.Users, title: "Create a group", desc: "Name it, add friends, done. Works for trips, rent, dinner, or anything.", col: "#6366f1" },
  { n: "02", Icon: Icons.Wallet, title: "Log expenses", desc: "Type it in or snap a receipt. Split however makes sense for your group.", col: "#a855f7" },
  { n: "03", Icon: Icons.PieChart, title: "Settle up", desc: "Live balances update instantly. SplitNest finds the optimal path to zero.", col: "#ec4899" },
];

const PLANS = [
  { name: "Free", price: "$0", period: "forever", desc: "Perfect for occasional splitting.", featured: false, cta: "Get started", features: ["Up to 3 groups", "10 expenses/month", "Basic settlements", "Mobile app"] },
  { name: "Pro", price: "$6", period: "per month", desc: "For power users who split everything.", featured: true, cta: "Start free trial", features: ["Unlimited groups", "Unlimited expenses", "Smart optimization", "Receipt scanning", "Priority support", "Export to CSV"] },
  { name: "Team", price: "$18", period: "per month", desc: "For businesses tracking shared expenses.", featured: false, cta: "Contact sales", features: ["Everything in Pro", "Up to 20 members", "Admin controls", "Audit log", "API access", "Custom branding"] },
];

const TESTIMONIALS = [
  { q: "We used to argue over money every trip. SplitNest ended that completely.", name: "Amara T.", role: "Frequent traveler", av: "AT", grad: "linear-gradient(135deg,#6366f1,#a855f7)" },
  { q: "8 people, 40 expenses, settled in 4 payments. The optimization is genuinely magical.", name: "James L.", role: "Software engineer", av: "JL", grad: "linear-gradient(135deg,#a855f7,#ec4899)" },
  { q: "Our house uses it for rent, utilities, groceries. Totally frictionless.", name: "Priya M.", role: "UX designer", av: "PM", grad: "linear-gradient(135deg,#22d3ee,#6366f1)" },
];

const fadeUpLanding = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function SplitNestLanding() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Scroll to Top Fix ──────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // inject styles once
  useEffect(() => {
    if (!document.getElementById("sn2-styles")) {
      const el = document.createElement("style");
      el.id = "sn2-styles";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    document.body.classList.add("sn2-grain");
    return () => { document.body.classList.remove("sn2-grain"); };
  }, []);

  // navbar scroll state
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // shared layout container
  const C: React.CSSProperties = { maxWidth: 1160, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 };

  return (
    <>
      {/* Global Cursor handled by RootLayout */}

      {/* NAVBAR */}
      <nav className={`sn2-nav${scrolled ? " sn2-scrolled" : ""}`}>
        <div style={{ ...C, display: "flex", alignItems: "center", justifyContent: "space-between", padding: scrolled ? "12px 24px" : "20px 24px" }}>
          <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
              <Icons.PieChart size={17} color="#fff" />
            </div>
            <span className="sn2-logo-grad" style={{ fontWeight: 800, fontSize: "1.25rem" }}>SplitNest</span>
          </a>

          <div className="sn2-hide-mob" style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {["Features", "How it works", "Pricing"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "")}`} className="sn2-nav-link">{l}</a>
            ))}
          </div>

          <div className="sn2-hide-mob" style={{ display: "flex", gap: 12 }}>
            <a href="/landing/auth" className="sn2-btn-ghost" style={{ padding: "9px 20px", fontSize: ".88rem", textDecoration: "none" }}>Login</a>
            <a href="/landing/auth?tab=signup" className="sn2-btn-primary" style={{ padding: "9px 20px", fontSize: ".88rem", textDecoration: "none" }}>Sign Up</a>
          </div>

          <button id="sn2-ham" className="sn2-btn-ghost" style={{ display: "none", padding: 8 }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <Icons.X size={20} color="#a5b4fc" /> : <Icons.Menu size={20} color="#a5b4fc" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "rgba(2,6,23,0.97)", borderTop: "1px solid rgba(99,102,241,0.15)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}
            >
              {["Features", "How it works", "Pricing"].map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "")}`} className="sn2-nav-link" onClick={() => setMenuOpen(false)} style={{ fontSize: "1.05rem", padding: "8px 0" }}>{l}</a>
              ))}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <a href="/landing/auth" className="sn2-btn-ghost" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>Login</a>
                <a href="/landing/auth?tab=signup" className="sn2-btn-primary" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}>Sign Up</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION */}
      <section className="sn2-grid-bg" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 120, paddingBottom: 120, overflow: "hidden" }}>
        <div className="sn2-orb" style={{ width: 800, height: 800, background: "radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)", top: -250, left: -250 }} />
        <div className="sn2-orb" style={{ width: 600, height: 600, background: "radial-gradient(circle,rgba(168,85,247,0.12),transparent 70%)", bottom: -150, right: -150 }} />

        <div style={{ ...C, textAlign: "center" }}>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
            }}
          >
            <motion.div variants={fadeUpLanding} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 100, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: 32, backdropFilter: "blur(8px)" }}>
              <span className="sn2-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", display: "inline-block", boxShadow: "0 0 12px #22d3ee" }} />
              <span style={{ fontSize: ".85rem", color: "#a5b4fc", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Release 1.0 · Split Smarter</span>
            </motion.div>

            <motion.h1 variants={fadeUpLanding} style={{ fontSize: "clamp(3.5rem,9vw,7rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-4px", maxWidth: 1000, margin: "0 auto 32px" }}>
              Expense splitting<br />
              <span className="sn2-grad">without the drama.</span>
            </motion.h1>

            <motion.p variants={fadeUpLanding} style={{ fontSize: "clamp(1.1rem,2.5vw,1.4rem)", color: "#94a3b8", maxWidth: 640, margin: "0 auto 48px", lineHeight: 1.6 }}>
              The most intuitive way to share costs with friends, roommates, and travel buddies. Beautifully designed, lightning fast, and free forever.
            </motion.p>

            <motion.div variants={fadeUpLanding} style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
              <button onClick={() => router.push("/landing/auth?tab=signup")} className="sn2-btn-primary" style={{ padding: "16px 40px", fontSize: "1.1rem" }}>
                Start splitting <Icons.ArrowRight size={20} color="#fff" />
              </button>
              <a href="#howitworks" className="sn2-btn-ghost" style={{ padding: "16px 32px", fontSize: "1.1rem", textDecoration: "none" }}>How it works</a>
            </motion.div>

            {/* Social Proof */}
            <motion.div variants={fadeUpLanding} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="sn2-avatar" style={{ background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 50%), hsl(${i * 60 + 40}, 70%, 50%))` }}>
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} size={14} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <span style={{ fontSize: ".9rem", color: "#64748b", fontWeight: 500 }}>Loved by 10,000+ splitters</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{ ...C, marginTop: -100, marginBottom: 160 }}
      >
        <motion.div
          whileHover={{ y: -8, scale: 1.005 }}
          style={{ background: "rgba(15,23,42,0.8)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", padding: 4, backdropFilter: "blur(30px)", boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)" }}
        >
          <div style={{ background: "#0f172a", borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "center" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
              <span style={{ marginLeft: 12, fontSize: ".8rem", color: "#475569", fontFamily: "monospace" }}>app.splitnest.com / tokyo-2024</span>
            </div>
            <div className="sn2-mock-grid" style={{ display: "grid", gridTemplateColumns: "240px 1fr" }}>
              <div style={{ padding: 24, borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: ".7rem", color: "#475569", letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 16, fontWeight: 700 }}>My Groups</div>
                {["Tokyo Trip", "Japan Rail", "SF Home"].map((g, i) => (
                  <div key={g} style={{ padding: "10px 12px", borderRadius: 12, background: i === 0 ? "rgba(99,102,241,0.1)" : "transparent", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#6366f1" : "#334155" }} />
                    <span style={{ fontSize: ".85rem", fontWeight: 600 }}>{g}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <div>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Tokyo Trip 🗼</h3>
                    <p style={{ fontSize: ".9rem", color: "#64748b" }}>Updated just now · 5 members</p>
                  </div>
                  <button className="sn2-btn-primary" style={{ padding: "8px 20px", fontSize: ".85rem" }}>+ Add Expense</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                  {[{ l: "Total Spend", v: "$3,420" }, { l: "Your Share", v: "$684" }, { l: "Owed to You", v: "$125" }].map(s => (
                    <div key={s.l} style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: ".75rem", color: "#475569", textTransform: "uppercase" as const, marginBottom: 8 }}>{s.l}</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: ".75rem", color: "#475569", textTransform: "uppercase" as const, marginBottom: 16 }}>Recent Activity</div>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.03)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: ".95rem", fontWeight: 600 }}>{i === 1 ? "Ichiran Ramen 🍜" : i === 2 ? "Museum Tickets 🎟️" : "IC Card Top-up 💳"}</div>
                      <div style={{ fontSize: ".8rem", color: "#475569" }}>Paid by {i % 2 === 0 ? "Aiko" : "You"}</div>
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: i % 2 === 0 ? "#f87171" : "#34d399" }}>{i % 2 === 0 ? "-$18.50" : "+$42.00"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* FEATURES */}
      <section id="features" style={{ padding: "120px 0", position: "relative" }}>
        <div style={C}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <div className="sn2-badge" style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>Features</div>
            <h2 style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 800, letterSpacing: "-2px" }}>Everything you need to <span className="sn2-grad">split fairly</span></h2>
          </div>
          <div className="sn2-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="sn2-card"
                style={{ padding: 40 }}
              >
                <div className="sn2-icon-box" style={{ background: f.bg, boxShadow: `0 0 30px ${f.glow}`, width: 60, height: 60, borderRadius: 18 }}>
                  <f.Icon size={26} color={f.col} />
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 12 }}>{f.label}</h3>
                <p style={{ color: "#94a3b8", fontSize: ".95rem", lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="howitworks" style={{ padding: "120px 0", background: "rgba(2,6,23,0.3)" }}>
        <div style={C}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 80 }}
          >
            <div className="sn2-badge" style={{ background: "rgba(168,85,247,0.08)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}>Workflow</div>
            <h2 style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 800, letterSpacing: "-2px" }}>Zero to <span className="sn2-grad-cyan">settled</span> in 3 steps</h2>
          </motion.div>

          <div className="sn2-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${s.col}33, transparent)`, border: `1px solid ${s.col}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", boxShadow: `0 0 40px ${s.col}11` }}>
                  <s.Icon size={32} color={s.col} />
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: "#94a3b8", fontSize: ".95rem", lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "120px 0", position: "relative" }}>
        <div className="sn2-orb" style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(236,72,153,0.1),transparent 70%)", left: "-10%", top: "20%" }} />
        <div style={C}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <div className="sn2-badge" style={{ background: "rgba(236,72,153,0.08)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.2)" }}>Pricing</div>
            <h2 style={{ fontSize: "clamp(2.5rem,5vw,3.5rem)", fontWeight: 800, letterSpacing: "-2px" }}>Simple, <span className="sn2-grad">honest pricing</span></h2>
          </div>

          <div className="sn2-price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {PLANS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`sn2-card ${p.featured ? "sn2-featured" : ""}`}
                style={{ padding: 48, display: "flex", flexDirection: "column" }}
              >
                <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: ".1em" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: "3rem", fontWeight: 800 }}>{p.price}</span>
                  <span style={{ color: "#475569" }}>/{p.period}</span>
                </div>
                <p style={{ color: "#64748b", fontSize: ".9rem", marginBottom: 32 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40, flex: 1 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".9rem" }}>
                      <Icons.Check size={16} color={p.featured ? "#a855f7" : "#6366f1"} />
                      <span style={{ color: "#94a3b8" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className={p.featured ? "sn2-btn-primary" : "sn2-btn-ghost"} style={{ width: "100%", justifyContent: "center" }}>{p.cta}</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "120px 0", background: "rgba(99,102,241,0.02)" }}>
        <div style={C}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="sn2-card"
                style={{ padding: 40, background: "rgba(15,23,42,0.5)" }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 24 }}>
                  {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} size={16} color="#fbbf24" fill="#fbbf24" />)}
                </div>
                <p style={{ fontSize: "1.1rem", fontStyle: "italic", lineHeight: 1.6, marginBottom: 32, color: "#e2e8f0" }}>"{t.q}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>{t.av}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: ".85rem", color: "#64748b" }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ padding: "160px 0", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="sn2-orb" style={{ width: 800, height: 800, background: "radial-gradient(circle,rgba(236,72,153,0.1),transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        <div style={C}>
          <h2 style={{ fontSize: "clamp(3rem,8vw,5.5rem)", fontWeight: 800, letterSpacing: "-4px", lineHeight: 1, marginBottom: 40 }}>Ready to <span className="sn2-grad">simplify</span><br />your life?</h2>
          <button onClick={() => router.push("/landing/auth?tab=signup")} className="sn2-btn-primary" style={{ padding: "18px 56px", fontSize: "1.2rem" }}>Get Started Free</button>
        </div>
      </section>

      <footer style={{ padding: "80px 0 40px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={C}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icons.PieChart size={16} color="#fff" /></div>
              <span className="sn2-logo-grad" style={{ fontWeight: 800, fontSize: "1.1rem" }}>SplitNest</span>
            </div>
            <span style={{ fontSize: ".85rem", color: "#475569" }}>© 2024 SplitNest Inc. Built with love.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
