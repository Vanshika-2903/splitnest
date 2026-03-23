"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Users, ChevronRight, Plane, Home, Layers,
  Check, AlertCircle
} from "lucide-react";
import {
  fetchGroups, createGroup, G_COLORS, GROUP_EMOJIS
} from "@/src/lib/supabase";

// ─── helpers ─────────────────────────────────────────────────────────────────
const fire = (msg: string, type: "ok" | "err" = "ok") =>
  window.dispatchEvent(new CustomEvent("snd-toast", { detail: { msg, type } }));

const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
};
const stagger = { show: { transition: { staggerChildren: .08 } } };

const TYPE_OPTS = [
  { id: "trip", label: "Trip", icon: Plane, desc: "Vacations & travel" },
  { id: "roommates", label: "Roommates", icon: Home, desc: "Shared living" },
  { id: "other", label: "Other", icon: Layers, desc: "Anything else" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [open, setOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gType, setGType] = useState<"trip" | "roommates" | "other">("trip");
  const [numMembers, setNumMembers] = useState<number>(2);
  const [memberNames, setMemberNames] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  // ── load ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchGroups();
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── member input count sync ───────────────────────────────────
  const handleNumChange = (n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    setNumMembers(clamped);
    setMemberNames(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push("");
      return next.slice(0, clamped);
    });
  };

  const updateMember = (i: number, val: string) => {
    setMemberNames(prev => { const n = [...prev]; n[i] = val; return n; });
  };

  // ── reset modal ───────────────────────────────────────────────
  const resetModal = () => {
    setGName(""); setGType("trip");
    setNumMembers(2); setMemberNames(["", ""]);
  };

  const closeModal = () => { setOpen(false); resetModal(); };

  // ── submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) { fire("Enter a group name", "err"); return; }
    const filled = memberNames.filter(m => m.trim());
    if (filled.length === 0) { fire("Add at least one member", "err"); return; }

    setSubmitting(true);
    const id = await createGroup(gName.trim(), gType, filled);
    if (id) {
      fire("Group created ✓");
      closeModal();
      load();
    } else {
      fire("Failed to create group", "err");
    }
    setSubmitting(false);
  };

  // ─── render ───────────────────────────────────────────────────
  return (
    <div className="snd-content">
      {/* Header */}
      <div className="snd-page-hdr">
        <div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.4px",
            background: "linear-gradient(135deg,#f1f0ff,#a5b4fc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Your Groups
          </h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4 }}>
            {loading ? "Loading…" : `${groups.length} group${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <motion.button
          className="snd-pri-btn"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: .96 }}
        >
          <Plus size={15} /> Create Group
        </motion.button>
      </div>

      {/* Groups grid */}
      {loading ? (
        <div className="snd-groups-grid">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="snd-skel" style={{ height: 200, borderRadius: 16 }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          className="snd-card snd-empty"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🪺</div>
          <h3>No groups yet</h3>
          <p>Create your first group to start splitting expenses with friends.</p>
          <button
            className="snd-pri-btn"
            style={{ margin: "20px auto 0", display: "flex" }}
            onClick={() => setOpen(true)}
          >
            <Plus size={14} /> Create Group
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="snd-groups-grid"
          variants={stagger} initial="hidden" animate="show"
        >
          {groups.map((g: any, i: number) => {
            const col = G_COLORS[i % G_COLORS.length];
            const emoji = GROUP_EMOJIS[g.type] ?? "💰";
            return (
              <motion.div
                key={g.id}
                className="snd-card"
                variants={fadeUp}
                whileHover={{
                  scale: 1.03,
                  y: -5,
                  rotateX: 1.5,
                  rotateY: 1.5,
                  boxShadow: `0 25px 50px rgba(0,0,0,0.4), 0 0 20px ${col}30`,
                  transition: { duration: .2 }
                }}
                onClick={() => router.push(`/dashboard/groups/${g.id}`)}
                style={{ padding: "22px 20px", cursor: "none", perspective: 1000 }}
              >
                {/* Glow layer */}
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
                  background: `radial-gradient(ellipse 100% 80% at 0% 0%,${col}14,transparent 65%)`
                }} />

                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: `${col}18`, border: `1px solid ${col}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", marginBottom: 14
                }}>
                  {emoji}
                </div>

                {/* Info */}
                 <div style={{
                   fontWeight: 700, fontSize: ".98rem", marginBottom: 5,
                   whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                   color: "var(--text-1)", transition: "color 0.2s"
                 }}>
                   {g.name}
                 </div>

                 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                   <span style={{ fontSize: ".72rem", color: "var(--text-2)", transition: "color 0.2s" }}>
                     <Users size={10} style={{ display: "inline", marginRight: 4 }} />
                     {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                   </span>
                   <span style={{
                     padding: "2px 8px", borderRadius: 20, fontSize: ".63rem",
                     fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase",
                     background: `${col}25`, color: col, border: `1px solid ${col}45`
                   }}>
                     {g.type}
                   </span>
                 </div>

                <div style={{
                  fontFamily: "'DM Mono',monospace", fontSize: "1.1rem",
                  fontWeight: 500, color: col, marginBottom: 14
                }}>
                  ₹{g.total_expense.toLocaleString()}
                </div>

                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingTop: 14, borderTop: `1px solid rgba(255,255,255,.06)`
                }}>
                   <span style={{ fontSize: ".72rem", color: "var(--text-3)", transition: "color 0.2s" }}>
                     {new Date(g.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                   </span>
                  <button
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 8, cursor: "none",
                      border: `1px solid ${col}28`, background: `${col}0e`,
                      color: col, fontSize: ".74rem", fontWeight: 600,
                      transition: "background .2s"
                    }}
                  >
                    Open <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Create Group Modal ───────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="snd-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              className="snd-modal"
              style={{ maxWidth: 520 }}
              initial={{ scale: .88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: .9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
            >
              {/* Modal header */}
              <div className="snd-modal-hdr">
                <div>
                  <h2 className="snd-modal-ttl">Create a Group</h2>
                  <p className="snd-modal-sub">Split expenses together</p>
                </div>
                <button className="snd-close-btn" onClick={closeModal}><X size={14} /></button>
              </div>

              <form onSubmit={handleSubmit} noValidate>

                {/* Group name */}
                <div className="snd-field">
                  <label>Group Name *</label>
                  <input
                    className="snd-input"
                    placeholder="e.g. Trip to Goa"
                    value={gName}
                    onChange={e => setGName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Group type */}
                <div className="snd-field">
                  <label>Group Type</label>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    {TYPE_OPTS.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className={`snd-type-btn${gType === t.id ? " on" : ""}`}
                        onClick={() => setGType(t.id as any)}
                        style={{ flex: 1 }}
                      >
                        <t.icon size={18} />
                        <span style={{ fontSize: ".8rem" }}>{t.label}</span>
                        <span style={{ fontSize: ".65rem", color: "var(--text-3)" }}>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of members */}
                <div className="snd-field">
                  <label>Number of Members</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleNumChange(numMembers - 1)}
                      style={{
                        width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.05)", color: "var(--text-1)",
                        fontSize: "1.2rem", cursor: "none", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        transition: "background .18s"
                      }}
                    >−</button>
                    <span style={{
                      fontFamily: "'DM Mono',monospace", fontSize: "1.2rem",
                      fontWeight: 600, minWidth: 32, textAlign: "center", color: "#a5b4fc"
                    }}>
                      {numMembers}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNumChange(numMembers + 1)}
                      style={{
                        width: 36, height: 36, borderRadius: 9, border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.05)", color: "var(--text-1)",
                        fontSize: "1.2rem", cursor: "none", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        transition: "background .18s"
                      }}
                    >+</button>
                    <span style={{ fontSize: ".75rem", color: "var(--text-3)" }}>
                      (max 20)
                    </span>
                  </div>
                </div>

                {/* Dynamic member name fields */}
                <div className="snd-field">
                  <label>Member Names</label>
                  <AnimatePresence initial={false}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {memberNames.map((name, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: .22, ease: "easeOut" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                              background: "linear-gradient(135deg,#6366f1,#a855f7)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: ".68rem", fontWeight: 700, color: "#fff"
                            }}>
                              {i + 1}
                            </div>
                            <input
                              className="snd-input"
                              style={{ height: 42, fontSize: ".88rem" }}
                              placeholder={`Member ${i + 1} name`}
                              value={name}
                              onChange={e => updateMember(i, e.target.value)}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </div>

                {/* Preview */}
                {gName && memberNames.some(m => m.trim()) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "rgba(99,102,241,.08)",
                      border: "1px solid rgba(99,102,241,.18)",
                      borderRadius: 12, padding: "14px 16px", marginBottom: 18
                    }}
                  >
                    <div style={{
                      fontSize: ".7rem", fontWeight: 700, letterSpacing: ".08em",
                      textTransform: "uppercase", color: "#818cf8", marginBottom: 10
                    }}>
                      Preview
                    </div>
                    <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 8 }}>
                      {GROUP_EMOJIS[gType]} {gName}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {memberNames.filter(m => m.trim()).map((m, i) => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: 20,
                          background: "rgba(99,102,241,.15)",
                          border: "1px solid rgba(99,102,241,.25)",
                          color: "#a5b4fc", fontSize: ".74rem", fontWeight: 500
                        }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="snd-modal-footer">
                  <button type="button" className="snd-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="snd-btn-submit" disabled={submitting}>
                    {submitting
                      ? <span className="snd-spin" />
                      : <><Plus size={14} style={{ display: "inline", marginRight: 6 }} />Create Group</>
                    }
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
