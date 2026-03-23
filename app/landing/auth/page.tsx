"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";

import { supabase } from "@/src/lib/supabase";

// ─── Countries ───────────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "IN", flag: "🇮🇳", name: "India", currency: "INR", symbol: "₹" },
  { code: "US", flag: "🇺🇸", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "CA", flag: "🇨🇦", name: "Canada", currency: "CAD", symbol: "$" },
  { code: "AU", flag: "🇦🇺", name: "Australia", currency: "AUD", symbol: "$" },
  { code: "EU", flag: "🇪🇺", name: "Europe", currency: "EUR", symbol: "€" },
  { code: "JP", flag: "🇯🇵", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "SG", flag: "🇸🇬", name: "Singapore", currency: "SGD", symbol: "$" },
  { code: "AE", flag: "🇦🇪", name: "UAE", currency: "AED", symbol: "د.إ" },
  { code: "BR", flag: "🇧🇷", name: "Brazil", currency: "BRL", symbol: "R$" },
];

// ─── Background data — generated CLIENT-SIDE ONLY to avoid hydration mismatch ─
// (Math.random() on server ≠ Math.random() on client → React throws)
// We generate these inside useEffect and store in state instead.
type Particle = { id: number; left: string; size: string; dur: string; delay: string; drift: string; color: string; };
type GLine = { id: number; top: string; left: string; w: string; dur: string; delay: string; };

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}

body.sna-page{
  font-family:'Instrument Sans',sans-serif;
  background:#0f172a;
  color:#f8fafc;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
}
body.sna-page input,
body.sna-page button,
body.sna-page select{font-family:'Instrument Sans',sans-serif;}

/* ── Mesh Background ── */
.sna-bg{
  position:fixed;inset:0;z-index:0;overflow:hidden;
  background-color:#0f172a;
}
.sna-mesh{
  position:absolute;inset:-50%;
  background: 
    radial-gradient(at 0% 0%, rgba(79,70,229,0.15) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(124,58,237,0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(34,211,238,0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(79,70,229,0.1) 0px, transparent 50%);
  filter: blur(80px);
  animation: snaMeshRotate 30s linear infinite;
}
@keyframes snaMeshRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.sna-gline{
  position:absolute;height:1px;
  background:linear-gradient(90deg,transparent,rgba(34,211,238,0.2),transparent);
  filter:blur(1px);
  animation:snaGlineMove 10s ease-in-out infinite;
}
@keyframes snaGlineMove {
  0%,100% { transform: translateX(-10%) translateY(0); opacity:0; }
  50% { transform: translateX(10%) translateY(20px); opacity:1; }
}

/* ── Card ── */
.sna-card-wrap {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 10;
}
.sna-card{
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 40px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
}
.sna-card-glow{
  position:absolute;inset:0;pointer-events:none;
  background: radial-gradient(circle at var(--x) var(--y), rgba(124,58,237,0.15), transparent 40%);
}

/* ── Floating Label ── */
.sna-f{position:relative;margin-bottom:24px;}
.sna-lbl{
  position:absolute;left:40px;top:14px;
  font-size:.9rem;color:#94a3b8;
  pointer-events:none;
  transition:all .3s cubic-bezier(0.23, 1, 0.32, 1);
  transform-origin:left top;
}
.sna-f.on .sna-lbl,
.sna-f:focus-within .sna-lbl{
  transform: translateY(-24px) scale(0.85);
  color: #818cf8;
}

.sna-inp, .sna-sel {
  width:100%;height:48px;
  padding:0 14px 0 40px;
  background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:12px;
  color:#fff;font-size:.95rem;
  outline:none;
  transition:all .2s ease;
}
.sna-inp:focus, .sna-sel:focus {
  background:rgba(129,140,248,0.06);
  border-color:rgba(129,140,248,0.4);
  box-shadow:0 0 20px rgba(129,140,248,0.15);
}

.sna-ico {
  color:#94a3b8;transition:color .3s;
}
.sna-f:focus-within .sna-ico{color:#818cf8;}

.sna-sel option {
  background: #1e293b;
  color: #fff;
}

/* ── Buttons ── */
.sna-btn{
  width:100%;height:52px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  background-size: 200% 100%;
  border:none;border-radius:12px;
  color:#fff;font-weight:700;font-size:1rem;
  cursor:pointer;overflow:hidden;
  position:relative;
  transition:all .4s ease;
  box-shadow:0 8px 24px -5px rgba(59, 130, 246, 0.4);
}
.sna-btn:hover:not(:disabled){
  background-position: 100% 0;
  transform:translateY(-2px);
  box-shadow:0 12px 30px -5px rgba(139, 92, 246, 0.5);
}
.sna-btn:active{transform:scale(0.98);}

.sna-soc-btn{
  flex:1;height:44px;
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px;
  color:#94a3b8;font-size:.85rem;
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .2s;
}
.sna-soc-btn:hover{
  background:rgba(255,255,255,0.06);
  color:#fff;
  border-color:rgba(255,255,255,0.1);
}

.sna-tabs{
  display:flex;background:rgba(255,255,255,0.02);
  padding:4px;border-radius:14px;margin-bottom:32px;
  border:1px solid rgba(255,255,255,0.04);
}
.sna-tab{
  flex:1;height:38px;border-radius:10px;
  font-weight:600;font-size:.85rem;
  transition:all .3s ease;color:#64748b;
}
.sna-tab.active{
  background:rgba(255,255,255,0.06);
  color:#fff;
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}

.sna-alert{
  padding:12px 16px;border-radius:12px;font-size:.85rem;
  margin-bottom:20px;display:flex;align-items:center;gap:10px;
  border:1px solid transparent;
}
.sna-alert-err{background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.15);color:#fca5a5;}
.sna-alert-ok{background:rgba(34,197,94,0.08);border-color:rgba(34,197,94,0.15);color:#86efac;}

.sna-shell{
  position:relative;z-index:10;
  min-height:100vh;width:100%;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  padding:40px 20px;
}

.sna-tag{
  text-align:center;
  color:#64748b;
  font-size:.85rem;
}

@media(max-width:480px){
  .sna-card{padding:30px 20px;}
}
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = ({ c, s = 16 }: { c: React.ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">{c}</svg>
);
const Mail = () => <Ic c={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>} />;
const Lock = () => <Ic c={<><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />;
const User = () => <Ic c={<><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></>} />;
const Globe = () => <Ic c={<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>} />;
const Eye = () => <Ic c={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>} />;
const EyeOff = () => <Ic c={<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></>} />;
const Pie = () => <Ic s={19} c={<><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>} />;
const Alert = () => <Ic c={<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>} />;
const Check = () => <Ic c={<path d="M20 6 9 17l-5-5" />} />;
const Arrow = () => <Ic c={<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>} />;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [country, setCountry] = useState("");
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Client-only background data
  const [particles, setParticles] = useState<Particle[] | null>(null);
  const [pwStrength, setPwStrength] = useState(0); // 0-4
  const router = useRouter();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }

  // Generate random background data client-side only (no SSR → no hydration mismatch)
  useEffect(() => {
    const colors = ["rgba(139,92,246,.6)", "rgba(99,102,241,.5)", "rgba(236,72,153,.4)", "rgba(34,211,238,.4)"];
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: (Math.random() * 100).toFixed(2) + "%",
      size: (1.8 + Math.random() * 2.2).toFixed(1) + "px",
      dur: (10 + Math.random() * 16).toFixed(1) + "s",
      delay: (Math.random() * 11).toFixed(1) + "s",
      drift: ((Math.random() - .5) * 110).toFixed(1) + "px",
      color: colors[i % 4],
    })));
  }, []);

  // ── read ?tab from URL ──────────────────────────────────────────────────────
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "signup") setMode("signup");
  }, []);

  // ── body class + styles ─────────────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.add("sna-page");
    if (!document.getElementById("sna-css")) {
      const el = document.createElement("style");
      el.id = "sna-css"; el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => { document.body.classList.remove("sna-page"); };
  }, []);

  // ── cursor ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const dot = document.getElementById("sna-dot");
    const ring = document.getElementById("sna-ring");
    const glow = document.getElementById("sna-glow-cur");
    if (!dot || !ring || !glow) return;

    let mx = 0, my = 0, rx = 0, ry = 0, gx = 0, gy = 0, raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    };
    const tick = () => {
      rx += (mx - rx) * .14; ry += (my - ry) * .14;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      gx += (mx - gx) * .07; gy += (my - gy) * .07;
      glow.style.left = gx + "px"; glow.style.top = gy + "px";
      raf = requestAnimationFrame(tick);
    };
    tick();

    const dn = () => document.body.classList.add("sna-click");
    const up = () => document.body.classList.remove("sna-click");
    const click = (e: MouseEvent) => {
      const r = document.createElement("div");
      r.className = "sna-ripple";
      r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 750);
    };
    const over = () => document.body.classList.add("sna-hover");
    const out = () => document.body.classList.remove("sna-hover");

    document.querySelectorAll("button,a,input,select").forEach(el => {
      el.addEventListener("mouseenter", over);
      el.addEventListener("mouseleave", out);
    });
    document.addEventListener("mousemove", move);
    document.addEventListener("mousedown", dn);
    document.addEventListener("mouseup", up);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousedown", dn);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("click", click);
    };
  }, []);

  // ── button ripple ───────────────────────────────────────────────────────────
  const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "sna-btn-rpl";
    s.style.left = (e.clientX - rect.left) + "px";
    s.style.top = (e.clientY - rect.top) + "px";
    e.currentTarget.appendChild(s);
    setTimeout(() => s.remove(), 600);
  };

  // ── Password Strength Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!password) { setPwStrength(0); return; }
    let s = 1;
    if (password.length > 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setPwStrength(Math.min(s, 4));
  }, [password]);

  // ── Confetti Logic ──────────────────────────────────────────────────────────
  const triggerConfetti = () => {
    for (let i = 0; i < 60; i++) {
      const c = document.createElement("div");
      c.className = "sna-confetti";
      const colors = ["#6366f1", "#a855f7", "#ec4899", "#22d3ee", "#fbbf24"];
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.left = "50%";
      c.style.top = "50%";
      const tx = (Math.random() - 0.5) * 800;
      const ty = (Math.random() - 0.5) * 800;
      c.style.setProperty("--tx", `${tx}px`);
      c.style.setProperty("--ty", `${ty}px`);
      c.style.animationDuration = (0.6 + Math.random() * 0.8) + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1500);
    }
  };

  const sel = COUNTRIES.find(c => c.code === country);

  const sw = (m: "login" | "signup") => { setMode(m); setError(""); setSuccess(""); };

  // ── login ───────────────────────────────────────────────────────────────────
  const onLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (data?.user) {
        setSuccess("Login successful! Redirecting…");
        setTimeout(() => router.push("/dashboard"), 800);
      }
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "Login failed. Please check your credentials.");
    }
    finally { setLoading(false); }
  }, [email, password, router]);

  // ── signup ──────────────────────────────────────────────────────────────────
  const onSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!name || !email || !password || !confirmPw || !country) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;

      if (data?.user) {
        const countryName = COUNTRIES.find(c => c.code === country)?.name || country;
        const currencyCode = COUNTRIES.find(c => c.code === country)?.currency || "INR";

        const { error: pErr } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: name,
          email: email,
          country: countryName,
          currency: currencyCode,
        });

        if (pErr) console.error("Profile creation error:", pErr);

        setSuccess("Account created! Redirecting to login…");
        triggerConfetti();
        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 3000);
      }
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e.message || "Signup failed. Please try again.");
    }
    finally { setLoading(false); }
  }, [email, password, confirmPw, country, name]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Animated background */}
      <div className="sna-bg">
        <div className="sna-mesh" />
        <div className="sna-blob" style={{ width: 800, height: 800, background: "radial-gradient(circle,rgba(79,70,229,0.1),transparent 70%)", top: "-10%", left: "-10%" }} />
        <div className="sna-blob" style={{ width: 600, height: 600, background: "radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%)", bottom: "-10%", right: "-10%" }} />
        
        {/* Glowing Lines */}
        <div className="sna-gline" style={{ top: "20%", left: "10%", width: "40%" }} />
        <div className="sna-gline" style={{ top: "50%", left: "40%", width: "30%", animationDelay: "-2s" }} />
        <div className="sna-gline" style={{ top: "80%", left: "20%", width: "50%", animationDelay: "-5s" }} />

        {particles && particles.map(p => (
          <motion.div 
            key={p.id} 
            className="sna-particle" 
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.5, 0] }}
            transition={{ duration: parseFloat(p.dur), delay: parseFloat(p.delay), repeat: Infinity, ease: "linear" }}
            style={{
              left: p.left, width: p.size, height: p.size,
              background: p.color,
            }} 
          />
        ))}
      </div>

      {/* Page */}
      <div className="sna-shell">
        <div className="sna-card-wrap">
          <Tilt
            tiltMaxAngleX={10}
            tiltMaxAngleY={10}
            perspective={1000}
            transitionSpeed={1500}
            scale={1.02}
            className="sna-tilt"
          >
            <div className="sna-card" onMouseMove={handleMouseMove} style={{ ["--x" as any]: `${mousePos.x}px`, ["--y" as any]: `${mousePos.y}px` }}>
              <div className="sna-card-glow" />

            {/* Logo */}
            <div className="sna-logo">
              <div className="sna-logo-icon"><Pie /></div>
              <span className="sna-logo-txt">SplitNest</span>
            </div>

            {/* Tabs */}
            <div className="sna-tabs">
              <button className={`sna-tab${mode === "login" ? " active" : ""}`} onClick={() => sw("login")}>Login</button>
              <button className={`sna-tab${mode === "signup" ? " active" : ""}`} onClick={() => sw("signup")}>Sign Up</button>
            </div>

            {/* Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="err" 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="sna-alert sna-alert-err"
                >
                  <Alert /><span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  key="ok" 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="sna-alert sna-alert-ok"
                >
                  <Check /><span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slider / Forms */}
            <div className="sna-outer">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.form 
                    key="login-form" 
                    onSubmit={onLogin} 
                    noValidate 
                    initial={{ opacity: 0, x: -20, rotateY: 10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: 20, rotateY: -10 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                  >
                    <div className={`sna-f${email ? " on" : ""}`}>
                      <motion.span 
                        className="sna-ico"
                        whileFocus={{ scale: 1.1, color: "#7C3AED" }}
                      >
                        <Mail />
                      </motion.span>
                      <input className="sna-inp" type="email" placeholder=" "
                        value={email} onChange={e => setEmail(e.target.value)}
                        required autoComplete="email" spellCheck={false} />
                      <label className="sna-lbl">Email address</label>
                    </div>

                    <div className={`sna-f${password ? " on" : ""}`}>
                      <motion.span 
                        className="sna-ico"
                        whileFocus={{ scale: 1.1, color: "#7C3AED" }}
                      >
                        <Lock />
                      </motion.span>
                      <input className="sna-inp" type={showPw ? "text" : "password"} placeholder=" "
                        value={password} onChange={e => setPassword(e.target.value)}
                        required autoComplete="current-password" />
                      <label className="sna-lbl">Password</label>
                      <button type="button" className="sna-eye" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff /> : <Eye />}
                      </button>
                    </div>

                    <div className="sna-row" style={{ marginTop: -10, marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" id="sna-rem" checked={remember} onChange={e => setRemember(e.target.checked)} />
                        <label htmlFor="sna-rem" style={{ fontSize: ".85rem", color: "#64748b" }}>Remember me</label>
                      </div>
                      <button type="button" className="sna-frgt" style={{ marginLeft: "auto", background: "none", border: "none", color: "#a5b4fc", fontSize: ".8rem" }}>Forgot password?</button>
                    </div>

                    <button type="submit" className="sna-btn link" disabled={loading} onClick={ripple}>
                      {loading ? <span className="sna-spin" /> : <span>Login to SplitNest</span>}
                    </button>

                    <div style={{ textAlign: "center", marginTop: 24, fontSize: ".9rem", color: "#64748b" }}>
                      Don&apos;t have an account?{" "}
                      <button type="button" style={{ background: "none", border: "none", color: "#a5b4fc", fontWeight: 600 }} onClick={() => sw("signup")}>Sign up free</button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form 
                    key="signup-form" 
                    onSubmit={onSignup} 
                    noValidate
                    initial={{ opacity: 0, x: 20, rotateY: -10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: -20, rotateY: 10 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                  >
                    <div className={`sna-f${name ? " on" : ""}`}>
                      <motion.span className="sna-ico" whileFocus={{ scale: 1.1, color: "#7C3AED" }}><User /></motion.span>
                      <input className="sna-inp" type="text" placeholder=" "
                        value={name} onChange={e => setName(e.target.value)}
                        required autoComplete="name" />
                      <label className="sna-lbl">Full name</label>
                    </div>

                    <div className={`sna-f${email ? " on" : ""}`}>
                      <motion.span className="sna-ico" whileFocus={{ scale: 1.1, color: "#7C3AED" }}><Mail /></motion.span>
                      <input className="sna-inp" type="email" placeholder=" "
                        value={email} onChange={e => setEmail(e.target.value)}
                        required autoComplete="email" spellCheck={false} />
                      <label className="sna-lbl">Email address</label>
                    </div>

                    <div className={`sna-f${password ? " on" : ""}`}>
                      <motion.span className="sna-ico" whileFocus={{ scale: 1.1, color: "#7C3AED" }}><Lock /></motion.span>
                      <input className="sna-inp" type={showPw ? "text" : "password"} placeholder=" "
                        value={password} onChange={e => setPassword(e.target.value)}
                        required autoComplete="new-password" />
                      <label className="sna-lbl">Password</label>
                      <button type="button" className="sna-eye" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff /> : <Eye />}
                      </button>
                      <div className="sna-pw-meter" style={{ marginTop: 8 }}>
                        {[1, 2, 3, 4].map(idx => (
                          <div key={idx} className="sna-pw-bar" style={{
                            width: "25%",
                            background: idx <= pwStrength
                              ? (pwStrength <= 2 ? "#f87171" : pwStrength === 3 ? "#fbbf24" : "#34d399")
                              : "rgba(255,255,255,0.05)"
                          }} />
                        ))}
                      </div>
                    </div>

                    <div className={`sna-f${confirmPw ? " on" : ""}`}>
                      <motion.span className="sna-ico" whileFocus={{ scale: 1.1, color: "#7C3AED" }}><Lock /></motion.span>
                      <input className="sna-inp" type={showCpw ? "text" : "password"} placeholder=" "
                        value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                        required autoComplete="new-password" />
                      <label className="sna-lbl">Confirm password</label>
                      <button type="button" className="sna-eye" onClick={() => setShowCpw(v => !v)}>
                        {showCpw ? <EyeOff /> : <Eye />}
                      </button>
                    </div>

                    <div className={`sna-f${country ? " on" : ""}`}>
                      <motion.span className="sna-ico" whileFocus={{ scale: 1.1, color: "#7C3AED" }}><Globe /></motion.span>
                      <select className="sna-sel" value={country} onChange={e => setCountry(e.target.value)} required>
                        <option value="" disabled></option>
                        {COUNTRIES.map(c => (
                          <option key={c.code} value={c.code}>{c.flag}  {c.name}</option>
                        ))}
                      </select>
                      <label className="sna-lbl">Country</label>
                    </div>

                    {sel && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="sna-cur" style={{ marginBottom: 20, marginTop: -10 }}>
                        <span style={{ fontSize: "1rem" }}>{sel.flag}</span>
                        <span>Your currency: <strong>{sel.symbol} {sel.currency}</strong></span>
                      </motion.div>
                    )}

                    <button type="submit" className="sna-btn link" disabled={loading} onClick={ripple}>
                      {loading ? <span className="sna-spin" /> : <span>Create Account</span>}
                    </button>

                    <div style={{ textAlign: "center", marginTop: 24, fontSize: ".9rem", color: "#64748b" }}>
                      Already have an account?{" "}
                      <button type="button" style={{ background: "none", border: "none", color: "#a5b4fc", fontWeight: 600 }} onClick={() => sw("login")}>Log in</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            </div>
          </Tilt>
        </div>

        <div className="sna-tag" style={{ opacity: 0.5, marginTop: 32 }}>🔒 256-bit encrypted · SOC 2 compliant · GDPR ready</div>
      </div>
    </>
  );
}
