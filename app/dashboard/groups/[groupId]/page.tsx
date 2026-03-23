"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, X, Users, Receipt, Check,
  TrendingUp, TrendingDown, ChevronRight, Wallet
} from "lucide-react";
import {
  fetchGroupById, createExpense, computeBalances,
  G_COLORS, GROUP_EMOJIS
} from "@/src/lib/supabase";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fire = (msg: string, type: "ok" | "err" = "ok") =>
  window.dispatchEvent(new CustomEvent("snd-toast", { detail: { msg, type } }));

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } } } as const;
const stagger = { show: { transition: { staggerChildren: .08 } } } as const;

const EXP_ICONS = ["✈️", "🍕", "🏨", "🛒", "⚡", "🎉", "🧾", "🚗"];

// ─── Component ───────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);

  // expense modal
  const [showModal, setShowModal] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mAmount, setMAmount] = useState("");
  const [mPaidBy, setMPaidBy] = useState("");
  const [mSplit, setMSplit] = useState<string[]>([]);
  const [mBusy, setMBusy] = useState(false);

  // ── load ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    const data = await fetchGroupById(groupId);
    if (!data) { setLoading(false); return; }
    setGroup(data);

    // Balances — pick first member's name as "me" (approximation; real app: use profile)
    const memberNames = (data.group_members ?? []).map((m: any) => m.name);
    const bal = computeBalances(data.expenses ?? [], memberNames[0] ?? "");
    setBalances(bal);

    // Defaults for modal
    if (memberNames[0]) { setMPaidBy(memberNames[0]); setMSplit(memberNames); }
    setLoading(false);
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  // ── submit expense ───────────────────────────────────────────
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mAmount) { fire("Fill title and amount", "err"); return; }
    if (mSplit.length === 0) { fire("Select at least one member to split with", "err"); return; }
    setMBusy(true);
    const ok = await createExpense(groupId, mTitle, parseFloat(mAmount), mPaidBy, mSplit);
    if (ok) {
      fire("Expense added ✓");
      triggerConfetti();
      setShowModal(false);
      setMTitle(""); setMAmount("");
      load();
    } else { fire("Failed to save expense", "err"); }
    setMBusy(false);
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

  if (loading) return (
    <div className="snd-content">
      <div style={{ display: "grid", gap: 14 }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="snd-skel" style={{ height: 80, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  if (!group) return (
    <div className="snd-content snd-empty">
      <h3>Group not found</h3>
      <p>This group may have been deleted or you don't have access.</p>
      <button className="snd-back-btn" style={{ margin: "16px auto 0" }}
        onClick={() => router.push("/dashboard/groups")}>
        <ArrowLeft size={14} /> Back to Groups
      </button>
    </div>
  );

  const members: any[] = group.group_members ?? [];
  const expenses: any[] = (group.expenses ?? []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const totalSpend = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const typeColor = G_COLORS[0];
  const emoji = GROUP_EMOJIS[group.type] ?? "💰";

  return (
    <div className="snd-content">

      {/* ── Page header ── */}
      <div className="snd-page-hdr">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="snd-back-btn"
            onClick={() => router.push("/dashboard/groups")}>
            <ArrowLeft size={14} /> Groups
          </button>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${typeColor}22`, border: `1px solid ${typeColor}3a`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
            boxShadow: `0 0 20px ${typeColor}1a`
          }}>
            {emoji}
          </div>
          <div>
            <h1 style={{
              fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.5px",
              color: "var(--text-1)"
            }}>
              {group.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span style={{
                padding: "2px 10px", borderRadius: 20, fontSize: ".65rem",
                fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase",
                background: `${typeColor}25`, color: typeColor, border: `1px solid ${typeColor}30`
              }}>
                {group.type}
              </span>
               <span style={{ fontSize: ".85rem", color: "var(--text-2)", fontWeight: 700, transition: "color 0.2s" }}>
                 {members.length} member{members.length !== 1 ? "s" : ""}
               </span>
            </div>
          </div>
        </div>
        <motion.button
          className="snd-pri-btn"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: .96 }}
        >
          <Plus size={15} /> Add Expense
        </motion.button>
      </div>

      <motion.div
        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}
        variants={stagger} initial="hidden" animate="show"
      >
        {[
          { label: "Total Spent", val: `₹${totalSpend.toLocaleString()}`, col: "#6366f1", ico: TrendingUp },
          { label: "Expenses", val: expenses.length.toString(), col: "#a855f7", ico: Receipt },
          { label: "Members", val: members.length.toString(), col: "#22d3ee", ico: Users },
        ].map(s => (
          <motion.div key={s.label} className="snd-card" variants={fadeUp}
            style={{ padding: "18px 18px", perspective: 1000 }}
            whileHover={{
              rotateX: 10, rotateY: 10, scale: 1.02,
              boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${s.col}22`,
              transition: { duration: .2 }
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none",
              background: `radial-gradient(ellipse 80% 60% at 10% 20%,${s.col}18,transparent 70%)`
            }} />
            <s.ico size={16} color={s.col} style={{ marginBottom: 10 }} />
             <div style={{ fontSize: ".85rem", color: "var(--text-2)", fontWeight: 700, marginBottom: 6, transition: "color 0.2s" }}>{s.label}</div>
             <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text-1)", transition: "color 0.2s" }}>{s.val}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Two-column: Members + Balances ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}
        className="snd-lower-grid">

        {/* Members */}
        <div>
          <p className="snd-sec-title"><Users size={10} />Members</p>
          <div className="snd-card" style={{ padding: "20px" }}>
            <motion.div variants={stagger} initial="hidden" animate="show">
              {members.map((m: any, i: number) => {
                const col = G_COLORS[i % G_COLORS.length];
                const expByMember = expenses.filter((e: any) => e.paid_by === m.name);
                const paidTotal = expByMember.reduce((s: number, e: any) => s + e.amount, 0);
                return (
                  <motion.div key={m.id} variants={fadeUp}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 0", borderBottom: "1.5px solid rgba(255,255,255,.07)"
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `linear-gradient(135deg,${col},${G_COLORS[(i + 1) % G_COLORS.length]})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".72rem", fontWeight: 700, color: "#fff",
                      boxShadow: `0 0 10px ${col}35`
                    }}>
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 600, fontSize: ".87rem", color: "var(--text-1)", transition: "color 0.2s" }}>{m.name}</div>
                       <div style={{ fontSize: ".7rem", color: "var(--text-2)", marginTop: 1, transition: "color 0.2s" }}>
                         paid ₹{paidTotal.toLocaleString()} across {expByMember.length} expense{expByMember.length !== 1 ? "s" : ""}
                       </div>
                     </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Balances */}
        <div>
          <p className="snd-sec-title"><Wallet size={10} />Balances</p>
          <div className="snd-card" style={{ padding: "20px" }}>
            {balances.length === 0 ? (
              <div className="snd-empty" style={{ padding: "30px 0" }}>
                <Check size={24} color="#10b981" style={{ margin: "0 auto 10px" }} />
                <p>All settled up!</p>
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show">
                {balances.map((b, i) => {
                  const isOwed = b.direction === "owed";
                  const col = isOwed ? "#22d3ee" : "#ec4899";
                  return (
                    <motion.div key={b.person} variants={fadeUp}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12, marginBottom: 10,
                        background: isOwed ? "rgba(34,211,238,.1)" : "rgba(236,72,153,.1)",
                        border: `1.5px solid ${col}30`
                      }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: `linear-gradient(135deg,${G_COLORS[i % G_COLORS.length]},${G_COLORS[(i + 2) % G_COLORS.length]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: ".68rem", fontWeight: 700, color: "#fff"
                      }}>
                        {b.person.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: ".84rem" }}>{b.person}</div>
                        <div style={{ fontSize: ".72rem", color: col, marginTop: 1 }}>
                          {isOwed ? "owes you" : "you owe"}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono',monospace", fontWeight: 600,
                        fontSize: ".92rem", color: col
                      }}>
                        {isOwed ? "+" : "-"}₹{b.amount.toLocaleString()}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Expense history ── */}
      <p className="snd-sec-title"><Receipt size={10} />Expense History</p>
      {expenses.length === 0 ? (
        <div className="snd-card snd-empty">
          <h3>No expenses yet</h3>
          <p>Add the first expense to this group.</p>
          <button className="snd-pri-btn" style={{ margin: "14px auto 0", display: "flex" }}
            onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Expense
          </button>
        </div>
      ) : (
        <motion.div className="snd-card" style={{ padding: "20px", marginBottom: 40 }}
          variants={stagger} initial="hidden" animate="show">
          {expenses.map((exp: any, i: number) => {
            const col = G_COLORS[i % G_COLORS.length];
            const splits = exp.expense_splits ?? [];
            const share = splits.length > 0
              ? `₹${splits[0].amount.toLocaleString()} each`
              : null;
            return (
              <motion.div key={exp.id} variants={fadeUp}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "16px 0", borderBottom: "1.5px solid rgba(255,255,255,.06)"
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${col}22`, border: `1.5px solid ${col}35`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem"
                }}>
                  {EXP_ICONS[i % EXP_ICONS.length]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--text-1)", transition: "color 0.2s" }}>{exp.title}</div>
                   <div style={{ fontSize: ".72rem", color: "var(--text-3)", marginTop: 2, transition: "color 0.2s" }}>
                     Paid by <span style={{ color: "var(--text-2)" }}>{exp.paid_by}</span>
                     {" · "}{new Date(exp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                   </div>
                  {splits.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {splits.map((s: any) => (
                        <span key={s.id} style={{
                          fontSize: ".68rem", padding: "3px 9px", borderRadius: 7,
                          background: `${col}18`, color: col, border: `1.5px solid ${col}28`
                        }}>
                          {s.member_name} · ₹{s.amount.toFixed(0)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: ".96rem",
                  fontWeight: 600, color: col, flexShrink: 0
                }}>
                  ₹{exp.amount.toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── FAB ── */}
      <motion.button className="snd-fab" onClick={() => setShowModal(true)}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: .5, type: "spring", stiffness: 200, damping: 18 }}
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
              exit={{ scale: .9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}>

              <div className="snd-modal-hdr">
                <div>
                  <h2 className="snd-modal-ttl">Add Expense</h2>
                  <p className="snd-modal-sub">{group.name}</p>
                </div>
                <button className="snd-close-btn" onClick={() => setShowModal(false)}>
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} noValidate>
                <div className="snd-field">
                  <label>Expense Title *</label>
                  <input className="snd-input" placeholder="e.g. Hotel booking"
                    value={mTitle} onChange={e => setMTitle(e.target.value)} required autoFocus />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="snd-field">
                    <label>Amount (₹) *</label>
                    <input className="snd-input" type="number" placeholder="0" min="0" step="0.01"
                      value={mAmount} onChange={e => setMAmount(e.target.value)} required />
                  </div>
                  <div className="snd-field">
                    <label>Paid By</label>
                    <select className="snd-select" value={mPaidBy} onChange={e => setMPaidBy(e.target.value)}>
                      {members.map((m: any) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="snd-field">
                  <label>Split Between</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {members.map((m: any) => (
                      <button key={m.id} type="button"
                        className={`snd-chip${mSplit.includes(m.name) ? " on" : ""}`}
                        onClick={() => toggleSplit(m.name)}>
                        {mSplit.includes(m.name) && <Check size={10} style={{ display: "inline", marginRight: 4 }} />}
                        {m.name}
                      </button>
                    ))}
                  </div>
                  {mSplit.length > 0 && mAmount && (
                    <div style={{ marginTop: 8, fontSize: ".75rem", color: "var(--text-3)" }}>
                      ₹{(parseFloat(mAmount || "0") / mSplit.length).toFixed(2)} each
                      ({mSplit.length} member{mSplit.length !== 1 ? "s" : ""})
                    </div>
                  )}
                </div>

                <div className="snd-modal-footer">
                  <button type="button" className="snd-btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="snd-btn-submit" disabled={mBusy}>
                    {mBusy ? <span className="snd-spin" /> : <><Plus size={14} style={{ display: "inline", marginRight: 6 }} />Add Expense</>}
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
