"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Receipt, Activity, Settings,
  LogOut, Bell, Plus, PieChart, Menu, X
} from "lucide-react";
import { supabase, getCurrentProfile, type Profile } from "@/src/lib/supabase";
import ThemeToggle from "@/src/components/ThemeToggle";
import "./snd.css";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Groups", icon: Users, href: "/dashboard/groups" },
  { label: "Expenses", icon: Receipt, href: "/dashboard/expenses" },
  { label: "Activity", icon: Activity, href: "/dashboard/activity" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [mounted, setMounted] = useState(false);

  // ── body class ───────────────────────────────────────────────
  useEffect(() => {
    document.body.classList.add("snd");
    return () => document.body.classList.remove("snd");
  }, []);

  // ── load profile ─────────────────────────────────────────────
  useEffect(() => {
    getCurrentProfile().then(setProfile);
    setMounted(true);
  }, []);

  // ── auth guard ───────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) router.push("/landing/auth");
      })
      .catch(err => {
        console.error("Auth session check failed:", err);
        router.push("/landing/auth");
      });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/landing/auth");
  };

  const initials = profile?.full_name
    ?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "SN";
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  // expose toast to child pages via a custom event
  useEffect(() => {
    const handler = (e: any) => { setToast(e.detail); setTimeout(() => setToast(null), 3500); };
    window.addEventListener("snd-toast", handler);
    return () => window.removeEventListener("snd-toast", handler);
  }, []);

  return (
    <>
      {/* Background */}
      <div className="snd-bg">
        <div className="snd-grid" />
        <div className="snd-noise" />

        {/* Ambient floating particles */}
        {mounted && [...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="snd-particle"
            style={{
              position: "absolute",
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              borderRadius: "50%",
              background: i % 2 === 0 ? "rgba(99,102,241,.4)" : "rgba(168,85,247,.3)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: "blur(1px)",
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, (Math.random() - 0.5) * 60],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}

        <motion.div className="snd-blob"
          style={{ width: 700, height: 700, background: "radial-gradient(circle,rgba(50,20,120,.5),transparent 70%)", top: -250, left: -250 }}
          animate={{ x: [0, 60, -40, 0], y: [0, -80, 50, 0], scale: [1, 1.1, .94, 1] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="snd-blob"
          style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(88,28,220,.3),transparent 70%)", bottom: -200, right: -100 }}
          animate={{ x: [0, -50, 30, 0], y: [0, 60, -40, 0], scale: [1, .9, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }} />
        <motion.div className="snd-blob"
          style={{ width: 350, height: 350, background: "radial-gradient(circle,rgba(168,85,247,.18),transparent 70%)", top: "40%", left: "45%" }}
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 10 }} />
      </div>

      {/* Layout */}
      <div className="snd-layout">

        {/* ── Sidebar ── */}
        <aside className={`snd-sidebar ${sideOpen ? 'open' : ''}`}>

          <div className="snd-logo-row">
            <div className="snd-logo-icon"><PieChart size={18} color="#fff" /></div>
            <span className="snd-logo-txt">SplitNest</span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span className="snd-nav-lbl">Menu</span>
            {NAV.map((item, i) => {
              const active = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <motion.button key={item.href}
                  className={`snd-nav-item${active ? " active" : ""}`}
                  onClick={() => { router.push(item.href); setSideOpen(false); }}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: .08 + i * .055, duration: .4, ease: [.22, 1, .36, 1] }}
                  whileHover={{ x: 3 }}>
                  <item.icon size={17} />
                  {item.label}
                  {active && (
                    <motion.div layoutId="nav-pip"
                      style={{
                        position: "absolute", right: 12, width: 6, height: 6, borderRadius: "50%",
                        background: "#818cf8", boxShadow: "0 0 12px rgba(129, 140, 248, 0.4)"
                      }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="snd-sidebar-btm">
            {/* Storage bar */}
            <div style={{ padding: "0 8px", marginBottom: 12 }}>
              <div className="snd-card" style={{ padding: "14px", borderRadius: 12 }}>
                 <div style={{ fontSize: ".75rem", color: "var(--text-1)", marginBottom: 6, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Plan</div>
                 <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 6 }}>
                   <motion.div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#8b5cf6,#3b82f6)" }}
                     initial={{ width: 0 }} animate={{ width: "62%" }}
                     transition={{ delay: .9, duration: .9, ease: "easeOut" }} />
                 </div>
                 <div style={{ fontSize: ".8rem", color: "var(--text-2)", fontWeight: 600 }}>Free plan · upgrade anytime</div>
              </div>
            </div>
            <button className="snd-logout" onClick={logout} style={{ opacity: 1, color: "#ff8a8a" }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sideOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 79, background: "rgba(4,3,13,.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setSideOpen(false)} />
          )}
        </AnimatePresence>

        {/* ── Main ── */}
        <main className="snd-main">

          {/* Topbar */}
          <motion.header className="snd-topbar"
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: .5, ease: [.22, 1, .36, 1] }}>
            <button className="snd-ham" onClick={() => setSideOpen(v => !v)}>
              {sideOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="snd-topbar-welcome">
              {mounted ? (
                <>
                   <h2 style={{ color: "var(--text-1)", transition: "color 0.2s" }}>{greeting}, {firstName} 👋</h2>
                   <p style={{ color: "var(--text-3)", transition: "color 0.2s" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                </>
              ) : (
                <div style={{ height: 44 }} />
              )}
            </div>
            <div className="snd-topbar-right">
              <ThemeToggle />
              <button className="snd-icon-btn" style={{ position: "relative" }}>
                <Bell size={16} />
                <span className="snd-notif-pip" />
              </button>
              <button className="snd-pri-btn"
                onClick={() => window.dispatchEvent(new CustomEvent("snd-open-expense"))}>
                <Plus size={15} /><span>Add Expense</span>
              </button>
              <div className="snd-ava">{initials}</div>
            </div>
          </motion.header>

          {/* Page content */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .38, ease: [.22, 1, .36, 1] }}>
            {children}
          </motion.div>
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={`snd-toast snd-toast-${toast.type}`}
            initial={{ opacity: 0, y: 20, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 220, damping: 20 }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
