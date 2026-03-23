"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, TrendingUp, TrendingDown, CreditCard,
  ArrowUpRight, ArrowDownLeft, Plus, X, Check,
  AlertCircle, Sparkles, Wallet, ChevronRight, Receipt
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";


import {
  getCurrentProfile, fetchGroups, fetchAllExpenses,
  computeBalances, createExpense, createPayment,
  Profile, G_COLORS, GROUP_EMOJIS
} from "@/src/lib/supabase";
const toast = (msg: string, type: "ok" | "err" = "ok") =>
  window.dispatchEvent(new CustomEvent("snd-toast", { detail: { msg, type } }));

const EXP_EMOJIS = ["✈️", "🏨", "🏠", "🍕", "🛒", "🎉", "⚡", "🧾"];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,12,35,.98)", border: "1px solid rgba(165,180,252,.3)",
      borderRadius: 12, padding: "12px 16px", fontSize: ".82rem",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.4)"
    }}>
      <div style={{ color: "#cbd5e1", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ color: "#c7d2fe", fontFamily: "'DM Mono',monospace", fontWeight: 600, fontSize: ".9rem" }}>
        ₹{Number(payload[0].value).toLocaleString()}
      </div>
    </div>
  );
};

const CountUp = ({ value, prefix = "", duration = 1.5 }: { value: string | number; prefix?: string; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  const num = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;

  useEffect(() => {
    let startTimestamp: number;
    const end = num;
    if (display === end) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      
      const current = display + (end - display) * easeOut(progress);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [num, duration]);

  return <span className="snd-count-anim">{prefix}{Number(display.toFixed(0)).toLocaleString()}</span>;
};

const fadeUp: any = { hidden: { opacity: 0, y: 20, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 20 } } };
const stagger: any = { show: { transition: { staggerChildren: .1 } } };

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Add Expense modal
  const [showModal, setShowModal] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mAmount, setMAmount] = useState("");
  const [mPaidBy, setMPaidBy] = useState("");
  const [mGroupId, setMGroupId] = useState("");
  const [mCategory, setMCategory] = useState("Others");
  const [mSplit, setMSplit] = useState<string[]>([]);
  const [mSubmitting, setMSubmitting] = useState(false);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  // Settle Up Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [sRecipient, setSRecipient] = useState("");
  const [sAmount, setSAmount] = useState("");
  const [sTotal, setSTotal] = useState(0); // Add this
  const [sGroupId, setSGroupId] = useState("");
  const [sDirection, setSDirection] = useState<"owe" | "owed">("owe");
  const [sSubmitting, setSSubmitting] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // ── listen for topbar "Add Expense" click ────────────────────
  useEffect(() => {
    const h = () => setShowModal(true);
    window.addEventListener("snd-open-expense", h);
    return () => window.removeEventListener("snd-open-expense", h);
  }, []);

  // ── load data ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, grps, exps] = await Promise.all([
        getCurrentProfile(),
        fetchGroups(),
        fetchAllExpenses()
      ]);
      setProfile(prof);
      setGroups(grps);
      setExpenses(exps);

      // balances
      const myName = prof?.full_name?.split(" ")[0] ?? "You";
      setBalances(computeBalances(exps, myName));

      // monthly trend (last 6 months)
      const buckets: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets[d.toLocaleString("en", { month: "short" })] = 0;
      }
      for (const e of exps) {
        const d = new Date(e.created_at);
        const key = d.toLocaleString("en", { month: "short" });
        if (key in buckets) buckets[key] += e.amount ?? 0;
      }
      setMonthly(Object.entries(buckets).map(([month, amount]) => ({ month, amount })));

      // per-group chart
      setChartData(grps.slice(0, 6).map((g: any, i: number) => ({
        name: g.name.split(" ")[0],
        amount: g.total_expense,
        fill: G_COLORS[i % G_COLORS.length],
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── when group changes, load its members ─────────────────────
  useEffect(() => {
    if (!mGroupId) { setGroupMembers([]); setMSplit([]); return; }
    const g = groups.find((x: any) => x.id === mGroupId);
    const names = (g?.members ?? []).map((m: any) => m.name);
    setGroupMembers(names);
    setMSplit(names); // default: split with everyone
    if (!mPaidBy && names[0]) setMPaidBy(names[0]);
  }, [mGroupId, groups, mPaidBy]);

  // ── submit expense ───────────────────────────────────────────
  const handleExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mAmount || !mGroupId) { toast("Fill all required fields", "err"); return; }
    setMSubmitting(true);
    const ok = await createExpense(mGroupId, mTitle, parseFloat(mAmount), mPaidBy, mSplit);
    if (ok) {
      toast("Expense added ✓");
      triggerConfetti();
      setShowModal(false);
      setMTitle(""); setMAmount(""); setMPaidBy(""); setMGroupId(""); setMSplit([]); setMCategory("Others");
      load();
    } else { toast("Failed to add expense", "err"); }
    setMSubmitting(false);
  }, [mTitle, mAmount, mGroupId, mPaidBy, mSplit, load]);

  const handleSettle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sAmount || !sGroupId) { toast("Fill all required fields", "err"); return; }
    setSSubmitting(true);
    const myName = profile?.full_name?.split(" ")[0] ?? "You";
    
    // If I owe them (owe), I am the payer.
    // If they owe me (owed), they are the payer.
    const from = sDirection === "owe" ? myName : sRecipient;
    const to = sDirection === "owe" ? sRecipient : myName;

    const ok = await createPayment(sGroupId, parseFloat(sAmount), from, to);
    if (ok) {
      toast("Settled up ✓");
      triggerConfetti();
      setShowSettleModal(false);
      setSAmount(""); setSGroupId(""); setSRecipient("");
      load();
    } else { toast("Failed to settle up", "err"); }
    setSSubmitting(false);
  }, [sAmount, sGroupId, sRecipient, sDirection, profile, load]);

  const openSettle = (balance: any) => {
    setSRecipient(balance.person);
    setSAmount(balance.amount.toString());
    setSTotal(balance.amount); // Store the actual total
    setSDirection(balance.direction);
    
    // Find groups that contain this person
    const grps = groups.filter(g => (g.members ?? []).some((m: any) => m.name === balance.person));
    setCommonGroups(grps);
    if (grps.length > 0) setSGroupId(grps[0].id);
    
    setShowSettleModal(true);
  };

  const triggerConfetti = () => {
    const count = 40;
    const colors = ["#6366f1", "#a855f7", "#ec4899", "#22d3ee"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "snd-confetti";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = "50%"; el.style.top = "50%";
      const tx = (Math.random() - 0.5) * 600;
      const ty = (Math.random() - 0.5) * 600;
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  };

  const toggleSplit = (m: string) =>
    setMSplit(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  // ── computed ─────────────────────────────────────────────────
  const totalOwe = useMemo(() => balances.filter(b => b.direction === "owe").reduce((s, b) => s + b.amount, 0), [balances]);
  const totalOwed = useMemo(() => balances.filter(b => b.direction === "owed").reduce((s, b) => s + b.amount, 0), [balances]);
  const totalSpend = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const STATS = [
    { icon: Users, label: "Total Groups", val: groups.length.toString(), col: "#818cf8", bg: "rgba(129,140,248,.12)", glow: "rgba(129,140,248,.3)" },
    { icon: CreditCard, label: "Total Expenses", val: expenses.length.toString(), col: "#a78bfa", bg: "rgba(167,139,250,.12)", glow: "rgba(167,139,250,.3)" },
    { icon: TrendingDown, label: "You Owe", val: `₹${totalOwe.toLocaleString()}`, col: "#f472b6", bg: "rgba(244,114,182,.12)", glow: "rgba(244,114,182,.3)" },
    { icon: TrendingUp, label: "You Are Owed", val: `₹${totalOwed.toLocaleString()}`, col: "#22d3ee", bg: "rgba(34,211,238,.12)", glow: "rgba(34,211,238,.3)" },
  ];

  return (
    <div className="snd-content">

      {/* ── Stats ── */}
      <p className="snd-sec-title"><Sparkles size={10} />Overview</p>
      {loading ? (
        <div className="snd-stat-grid" style={{ marginBottom: 28 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="snd-skel" style={{ height: 130, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <motion.div className="snd-stat-grid" style={{ marginBottom: 28 }}
          variants={stagger} initial="hidden" animate="show">
          {STATS.map((s) => (
            <motion.div key={s.label} className="snd-card" variants={fadeUp}
              style={{ padding: "22px 20px" }}
              whileHover={{
                y: -6,
                scale: 1.02,
                boxShadow: `0 20px 40px rgba(0,0,0,0.3), 0 0 20px ${s.glow}`,
                transition: { duration: .2, ease: "easeOut" }
              }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
                background: `radial-gradient(ellipse 80% 60% at 10% 20%,${s.bg},transparent 70%)`
              }} />
              <div style={{
                width: 40, height: 40, borderRadius: 11, background: s.bg,
                boxShadow: `0 0 16px ${s.glow}`, display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: 16
              }}>
                <s.icon size={18} color={s.col} />
              </div>
              <div style={{
                fontFamily: "'DM Mono',monospace", fontSize: "1.5rem", fontWeight: 500,
                letterSpacing: "-.5px", color: s.col, textShadow: `0 0 18px ${s.glow}`, marginBottom: 5
              }}>
                {s.val}
              </div>
              <div style={{ fontSize: ".85rem", color: "var(--text-2)", fontWeight: 700, transition: "color 0.2s" }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Groups ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p className="snd-sec-title" style={{ margin: 0 }}><Users size={10} />Groups</p>
        <button style={{
          fontSize: ".75rem", color: "var(--text-3)", background: "none", border: "none",
          cursor: "none", display: "flex", alignItems: "center", gap: 4
        }}
          onClick={() => router.push("/dashboard/groups")}>
          View all <ChevronRight size={13} />
        </button>
      </div>

      {loading ? (
        <div className="snd-groups-grid">
          {[0, 1, 2, 3].map(i => <div key={i} className="snd-skel" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="snd-card snd-empty" style={{ marginBottom: 28 }}>
          <h3>No groups yet</h3>
          <p>Create a group to start splitting expenses with friends.</p>
          <button className="snd-pri-btn" style={{ margin: "16px auto 0", display: "flex" }}
            onClick={() => router.push("/dashboard/groups")}>
            <Plus size={14} /> Create Group
          </button>
        </div>
      ) : (
        <motion.div className="snd-groups-grid" variants={stagger} initial="hidden" animate="show">
          {groups.slice(0, 4).map((g: any, i: number) => {
            const col = G_COLORS[i % G_COLORS.length];
            const emoji = GROUP_EMOJIS[g.type] ?? "💰";
            return (
              <motion.div key={g.id} className="snd-card" variants={fadeUp}
                style={{ padding: "20px", cursor: "none" }}
                whileHover={{ scale: 1.025, y: -3, transition: { duration: .18 } }}
                onClick={() => router.push(`/dashboard/groups/${g.id}`)}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
                  background: `radial-gradient(ellipse 100% 80% at 0% 0%,${col}12,transparent 65%)`
                }} />
                <div style={{
                  width: 42, height: 42, borderRadius: 11, background: `${col}18`,
                  border: `1px solid ${col}28`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "1.3rem", marginBottom: 12
                }}>{emoji}</div>
                <div style={{
                  fontWeight: 700, fontSize: ".94rem", marginBottom: 4,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  color: "var(--text-1)", transition: "color 0.2s"
                }}>{g.name}</div>
                <p style={{ fontSize: ".88rem", color: "var(--text-2)", marginTop: 6, fontWeight: 600, transition: "color 0.2s" }}>
                  {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                  <span style={{
                    marginLeft: 8, padding: "1px 7px", borderRadius: 6,
                    background: `${col}14`, color: col, fontSize: ".65rem", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".05em"
                  }}>{g.type}</span>
                </p>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "1.05rem", fontWeight: 500, color: col }}>
                  ₹{g.total_expense.toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Removed Expense Insights (Charts) ── */}

      {/* ── Lower: Recent Expenses + Activity Feed ── */}
      <div 
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, marginBottom: 32 }}
        className="snd-lower-grid"
      >
        {/* Recent Expenses */}
        <div>
          <p className="snd-sec-title"><Receipt size={10} />Recent Expenses</p>
          <div className="snd-card" style={{ padding: "20px" }}>
            {loading ? (
              [0, 1, 2, 3].map(i => <div key={i} className="snd-skel" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />)
            ) : expenses.length === 0 ? (
              <div className="snd-empty"><p>No expenses yet.</p></div>
            ) : (
              (showAllExpenses ? expenses : expenses.slice(0, 4)).map((exp: any, i: number) => {
                const col = G_COLORS[i % G_COLORS.length];
                return (
                  <motion.div key={exp.id} className="snd-exp-row"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: .05 + i * .06, duration: .35 }}>
                    <div className="snd-exp-ico" style={{ background: `${col}18`, border: `1px solid ${col}28` }}>
                      {EXP_EMOJIS[i % EXP_EMOJIS.length]}
                    </div>
                    <div className="snd-exp-info">
                      <div className="snd-exp-title">{exp.title}</div>
                      <div className="snd-exp-meta">
                        <span style={{ color: "var(--text-3)", transition: "color 0.2s" }}>paid by {exp.paid_by}</span>
                        {exp.groups?.name && <> · {exp.groups.name}</>}
                      </div>
                      {(exp.expense_splits ?? []).length > 0 && (
                        <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(exp.expense_splits ?? []).slice(0, 3).map((s: any) => (
                            <span key={s.id} style={{
                              fontSize: ".63rem", padding: "1px 6px", borderRadius: 5,
                              background: `${col}14`, color: col, border: `1px solid ${col}1e`
                            }}>
                              {s.member_name}
                            </span>
                          ))}
                          {(exp.expense_splits ?? []).length > 3 &&
                            <span style={{ fontSize: ".63rem", color: "var(--text-2)", fontWeight: 600 }}>
                              +{(exp.expense_splits ?? []).length - 3}
                            </span>}
                        </div>
                      )}
                    </div>
                    <div className="snd-exp-amt" style={{ color: col }}>₹{exp.amount.toLocaleString()}</div>
                  </motion.div>
                );
              })
            )}
            
            {expenses.length > 4 && (
              <button
                onClick={() => setShowAllExpenses(!showAllExpenses)}
                style={{
                  width: "100%", padding: "12px", marginTop: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, color: "var(--text-2)", fontSize: ".78rem", fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.2s", cursor: "none"
                }}
                className="snd-show-more-btn"
              >
                {showAllExpenses ? "Show Less" : `View ${expenses.length - 4} more`}
                <motion.div animate={{ rotate: showAllExpenses ? 180 : 0 }}>
                  <TrendingDown size={14} style={{ opacity: 0.7 }} />
                </motion.div>
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity Feed removed */}
      </div>

      {/* ── Balances ── */}
      {!loading && balances.length > 0 && (
        <>
          <p className="snd-sec-title"><Wallet size={10} />Balance Summary</p>
          <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, marginBottom: 32 }}
            variants={stagger} initial="hidden" animate="show">
            {balances.map((b, i) => {
              const isOwed = b.direction === "owed";
              const col = isOwed ? "#22d3ee" : "#ec4899";
              const bg = isOwed ? "rgba(34,211,238,.08)" : "rgba(236,72,153,.08)";
              const avGs = ["linear-gradient(135deg,#6366f1,#a855f7)", "linear-gradient(135deg,#a855f7,#ec4899)",
                "linear-gradient(135deg,#22d3ee,#6366f1)", "linear-gradient(135deg,#ec4899,#f43f5e)"];
              return (
                <motion.div key={b.person} className="snd-card" variants={fadeUp}
                  style={{ padding: "16px 18px" }}
                  whileHover={{ y: -2, transition: { duration: .18 } }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: bg, borderRadius: 12, padding: "12px 14px"
                  }}>
                    <div className="snd-bal-ava" style={{ background: avGs[i % avGs.length], boxShadow: `0 0 10px ${col}40` }}>
                      {b.person.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: ".85rem" }}>{b.person}</div>
                      <div style={{ fontSize: ".72rem", color: col, fontWeight: 500, marginTop: 1 }}>
                        {isOwed ? "owes you" : "you owe"}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: ".95rem", fontWeight: 600, color: col }}>
                      {isOwed ? "+" : "-"}₹{b.amount.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ marginTop: 10, height: 3, borderRadius: 3, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
                    <motion.div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${col}70,${col})` }}
                      initial={{ width: 0 }} animate={{ width: `${Math.min(100, (b.amount / 5000) * 100)}%` }}
                      transition={{ delay: .3 + i * .08, duration: .7, ease: "easeOut" }} />
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => openSettle(b)}
                      style={{
                        fontSize: ".72rem", padding: "4px 11px", borderRadius: 7,
                        border: `1px solid ${col}28`, background: `${col}0e`, color: col, cursor: "none"
                      }}
                    >
                      Settle up →
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* ── FAB ── */}
      <motion.button className="snd-fab" onClick={() => setShowModal(true)}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: .6, type: "spring", stiffness: 200, damping: 18 }}
        whileHover={{ scale: 1.1, rotate: 8 }} whileTap={{ scale: .93 }}>
        <Plus size={24} />
      </motion.button>

      {/* ── Add Expense Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="snd-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div className="snd-modal"
              initial={{ scale: .88, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: .88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}>

              <div className="snd-modal-hdr">
                <div>
                  <h2 className="snd-modal-ttl">Add Expense</h2>
                  <p className="snd-modal-sub">Split it fairly with your group</p>
                </div>
                <button className="snd-close-btn" onClick={() => setShowModal(false)}><X size={14} /></button>
              </div>

              <form onSubmit={handleExpense} noValidate>
                <div className="snd-field">
                  <label>Expense Title *</label>
                  <input className="snd-input" placeholder="e.g. Dinner at Nobu"
                    value={mTitle} onChange={e => setMTitle(e.target.value)} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="snd-field">
                    <label>Amount (₹) *</label>
                    <input className="snd-input" type="number" placeholder="0" min="0"
                      value={mAmount} onChange={e => setMAmount(e.target.value)} required />
                  </div>
                  <div className="snd-field">
                    <label>Group *</label>
                    <select className="snd-select" value={mGroupId} onChange={e => setMGroupId(e.target.value)} required>
                      <option value="">Select group</option>
                      {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="snd-field">
                    <label>Paid By</label>
                    <select className="snd-select" value={mPaidBy} onChange={e => setMPaidBy(e.target.value)}>
                      {groupMembers.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="snd-field">
                    <label>Category</label>
                    <select className="snd-select" value={mCategory} onChange={e => setMCategory(e.target.value)}>
                      <option value="Others">Others</option>
                      <option value="Food">Food</option>
                      <option value="Travel">Travel</option>
                      <option value="Rent">Rent</option>
                      <option value="Shopping">Shopping</option>
                    </select>
                  </div>
                </div>

                {mGroupId && (
                  <>

                    <div className="snd-field">
                      <label>Split Between</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                        {groupMembers.map(m => (
                          <button key={m} type="button"
                            className={`snd-chip${mSplit.includes(m) ? " on" : ""}`}
                            onClick={() => toggleSplit(m)}>
                            {mSplit.includes(m) && <Check size={10} style={{ marginRight: 4, display: "inline" }} />}
                            {m}
                          </button>
                        ))}
                      </div>
                      {mSplit.length > 0 && mAmount && (
                        <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--text-3)" }}>
                          Each pays ₹{(parseFloat(mAmount || "0") / mSplit.length).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="snd-modal-footer">
                  <button type="button" className="snd-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="snd-btn-submit" disabled={mSubmitting}>
                    {mSubmitting ? <span className="snd-spin" /> : <><Plus size={14} style={{ display: "inline", marginRight: 6 }} />Add Expense</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settle Up Modal ── */}
      <AnimatePresence>
        {showSettleModal && (
          <motion.div className="snd-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowSettleModal(false); }}>
            <motion.div className="snd-modal"
              initial={{ scale: .88, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: .88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}>

              <div className="snd-modal-hdr">
                <div>
                  <h2 className="snd-modal-ttl">Settle Up</h2>
                  <p className="snd-modal-sub">Record a payment to {sRecipient}</p>
                </div>
                <button className="snd-close-btn" onClick={() => setShowSettleModal(false)}><X size={14} /></button>
              </div>

              <form onSubmit={handleSettle} noValidate>
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem" }}>
                    {sRecipient.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: ".85rem", fontWeight: 600 }}>{sRecipient}</div>
                    <div style={{ fontSize: ".72rem", color: sDirection === "owed" ? "#22d3ee" : "#ec4899", display: "flex", flexDirection: "column", gap: 2 }}>
                      <span>Total Balance: ₹{sTotal.toLocaleString()}</span>
                      <span style={{ fontWeight: 600, opacity: 0.9 }}>
                        {sDirection === "owed" ? "Receiving" : "Paying"}: ₹{parseFloat(sAmount || "0").toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="snd-field">
                  <label>Amount (₹) *</label>
                  <input className="snd-input" type="number" placeholder="0" min="0" step="0.01"
                    value={sAmount} onChange={e => setSAmount(e.target.value)} required />
                </div>

                <div className="snd-field">
                  <label>Group *</label>
                  <select className="snd-select" value={sGroupId} onChange={e => setSGroupId(e.target.value)} required>
                    <option value="">Select group</option>
                    {commonGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  {commonGroups.length === 0 && <p style={{ fontSize: ".65rem", color: "#f43f5e", marginTop: 4 }}>No common groups found with this person.</p>}
                </div>

                <div className="snd-modal-footer">
                  <button type="button" className="snd-btn-cancel" onClick={() => setShowSettleModal(false)}>Cancel</button>
                  <button type="submit" className="snd-btn-submit" disabled={sSubmitting || commonGroups.length === 0}>
                    {sSubmitting ? <span className="snd-spin" /> : <><Check size={14} style={{ display: "inline", marginRight: 6 }} />Record Payment</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
