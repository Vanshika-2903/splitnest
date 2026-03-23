"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { fetchAllExpenses, G_COLORS, GROUP_EMOJIS } from "@/src/lib/supabase";

const CountUp = ({ value, prefix = "", duration = 1.2 }: { value: string | number; prefix?: string; duration?: number }) => {
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
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [num, duration]);
  return <span>{prefix}{Number(display.toFixed(0)).toLocaleString()}</span>;
};

const fadeUp: any = { hidden: { opacity: 0, y: 16, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 18 } } };
const stagger: any = { show: { transition: { staggerChildren: .04 } } };

const EXP_ICONS = ["✈️", "🍕", "🏨", "🛒", "⚡", "🎉", "🧾", "🚗", "🏖️", "🍻", "🎵", "🧳"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function groupByDate(expenses: any[]): Record<string, any[]> {
  const buckets: Record<string, any[]> = {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  for (const exp of expenses) {
    const d = new Date(exp.created_at); d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    if (!buckets[label]) buckets[label] = [];
    buckets[label].push(exp);
  }
  return buckets;
}

export default function ActivityPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllExpenses();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => groupByDate(expenses), [expenses]);
  const dateKeys = Object.keys(grouped);

  const totalToday = grouped["Today"]?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const totalThis = expenses
    .filter(e => {
      const d = new Date(e.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

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
            Activity
          </h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4 }}>
            {loading ? "Loading…" : `${expenses.length} action${expenses.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      {/* Mini stats */}
      {!loading && expenses.length > 0 && (
        <motion.div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4 }}
        >
          <motion.div className="snd-card" style={{ padding: "16px 18px" }}
            whileHover={{ y: -4, scale: 1.02, boxShadow: "0 15px 30px rgba(99,102,241,0.2)" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: "radial-gradient(ellipse 80% 60% at 10% 20%,rgba(99,102,241,.12),transparent 70%)"
            }} />
            <Calendar size={15} color="#6366f1" style={{ marginBottom: 8 }} />
            <motion.div style={{
              fontFamily: "'DM Mono',monospace", fontSize: "1.2rem", fontWeight: 500,
              color: "#6366f1", marginBottom: 3
            }}>
              <CountUp value={totalToday} prefix="₹" />
            </motion.div>
            <div style={{ fontSize: ".72rem", color: "var(--text-3)" }}>Spent today</div>
          </motion.div>
          <motion.div className="snd-card" style={{ padding: "16px 18px" }}
            whileHover={{ y: -4, scale: 1.02, boxShadow: "0 15px 30px rgba(168,85,247,0.2)" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: "radial-gradient(ellipse 80% 60% at 10% 20%,rgba(168,85,247,.12),transparent 70%)"
            }} />
            <TrendingUp size={15} color="#a855f7" style={{ marginBottom: 8 }} />
            <motion.div style={{
              fontFamily: "'DM Mono',monospace", fontSize: "1.2rem", fontWeight: 500,
              color: "#a855f7", marginBottom: 3
            }}>
              <CountUp value={totalThis} prefix="₹" />
            </motion.div>
            <div style={{ fontSize: ".72rem", color: "var(--text-3)" }}>This month</div>
          </motion.div>
        </motion.div>
      )}

      {/* Activity feed */}
      {loading ? (
        <div style={{ display: "grid", gap: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="snd-skel"
              style={{ height: 70, borderRadius: 14, opacity: 1 - i * .1 }} />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <motion.div className="snd-card snd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
          <h3>No activity yet</h3>
          <p>Your expense activity will appear here once you start adding expenses.</p>
        </motion.div>
      ) : (
        <div style={{ marginBottom: 40 }}>
          {dateKeys.map((dateKey, di) => (
            <motion.div key={dateKey}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: di * .06, duration: .38, ease: [.22, 1, .36, 1] }}
              style={{ marginBottom: 28 }}
            >
              {/* Date header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 14
              }}>
                <span style={{
                  fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em",
                  textTransform: "uppercase", color: "#818cf8",
                  padding: "3px 10px", borderRadius: 8,
                  background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.2)"
                }}>
                  {dateKey}
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(99,102,241,.15),transparent)" }} />
                <span style={{
                  fontSize: ".7rem", fontFamily: "'DM Mono',monospace",
                  color: "var(--text-3)"
                }}>
                  ₹{grouped[dateKey].reduce((s, e) => s + e.amount, 0).toLocaleString()}
                </span>
              </div>

              {/* Timeline */}
              <div style={{ position: "relative" }}>
                {/* Vertical line */}
                <div style={{
                  position: "absolute", left: 19, top: 10, bottom: 10, width: 1,
                  background: "linear-gradient(180deg,rgba(99,102,241,.3),transparent)",
                  pointerEvents: "none"
                }} />

                <motion.div variants={stagger} initial="hidden" animate="show"
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {grouped[dateKey].map((exp: any, i: number) => {
                    const col = G_COLORS[i % G_COLORS.length];
                    const splits = exp.expense_splits ?? [];
                    const gEmoji = GROUP_EMOJIS[exp.groups?.type] ?? "💰";

                    return (
                      <motion.div key={exp.id} variants={fadeUp}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 14,
                          padding: "14px 16px 14px 0", cursor: "none",
                          borderRadius: 13,
                          transition: "background .18s"
                        }}
                        whileHover={{
                          backgroundColor: "rgba(255,255,255,.025)",
                          x: 3, transition: { duration: .15 }
                        }}
                        onClick={() => exp.groups?.id && router.push(`/dashboard/groups/${exp.groups.id}`)}
                      >
                        {/* Timeline dot + icon */}
                        <div style={{ position: "relative", flexShrink: 0, paddingLeft: 6 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 9,
                            background: `${col}20`, border: `1.5px solid ${col}35`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: ".78rem", zIndex: 1, position: "relative",
                            boxShadow: `0 0 8px ${col}25`
                          }}>
                            {EXP_ICONS[i % EXP_ICONS.length]}
                          </div>
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Activity sentence */}
                          <div style={{ fontSize: ".88rem", fontWeight: 500, lineHeight: 1.5 }}>
                            <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{exp.paid_by}</span>
                            {" added "}
                            <span style={{
                              fontFamily: "'DM Mono',monospace",
                              color: col, fontWeight: 600
                            }}>
                              ₹{exp.amount.toLocaleString()}
                            </span>
                            {" for "}
                            <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{exp.title}</span>
                            {exp.groups?.name && (
                              <> in <span
                                style={{ color: col, fontWeight: 600 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/groups/${exp.groups.id}`);
                                }}
                              >{gEmoji} {exp.groups.name}</span></>
                            )}
                          </div>

                          {/* Split summary */}
                          {splits.length > 0 && (
                            <div style={{
                              marginTop: 6, fontSize: ".72rem", color: "var(--text-3)",
                              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"
                            }}>
                              <span>Split with:</span>
                              {splits.map((s: any, si: number) => (
                                <span key={s.id} style={{
                                  padding: "1px 7px", borderRadius: 5,
                                  background: `${col}0e`, color: col, border: `1px solid ${col}18`,
                                  fontSize: ".68rem"
                                }}>
                                  {s.member_name} · ₹{s.amount.toFixed(0)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Time + link */}
                        <div style={{
                          display: "flex", flexDirection: "column",
                          alignItems: "flex-end", gap: 6, flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: ".7rem", color: "var(--text-3)",
                            fontFamily: "'DM Mono',monospace"
                          }}>
                            {timeAgo(exp.created_at)}
                          </span>
                          <ChevronRight size={13} color="var(--text-3)" />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
