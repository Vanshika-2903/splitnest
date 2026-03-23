"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, Search, ChevronRight, Filter,
  TrendingUp, CreditCard, Users
} from "lucide-react";
import { fetchAllExpenses, G_COLORS, GROUP_EMOJIS } from "@/src/lib/supabase";

const fadeUp = { hidden: { opacity: 0, y: 12, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } } } as const;
const stagger = { show: { transition: { staggerChildren: .08 } } } as const;
const EXP_ICONS = ["✈️", "🍕", "🏨", "🛒", "⚡", "🎉", "🧾", "🚗", "🏖️", "🍻"];

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllExpenses();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // All unique groups from expenses
  const allGroups = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of expenses) {
      if (e.groups?.id) map[e.groups.id] = e.groups.name;
    }
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [expenses]);

  // Filtered expenses
  const filtered = useMemo(() => {
    let list = expenses;
    if (groupFilter !== "all") list = list.filter(e => e.groups?.id === groupFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.paid_by?.toLowerCase().includes(q) ||
        e.groups?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [expenses, groupFilter, search]);

  // Summary stats
  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const avgExpense = expenses.length ? totalSpend / expenses.length : 0;
  const uniqueGroups = new Set(expenses.map(e => e.groups?.id)).size;

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
            All Expenses
          </h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4 }}>
            {loading ? "Loading…" : `${filtered.length} expense${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}
        variants={stagger} initial="hidden" animate="show"
      >
        {[
          { label: "Total Spent", val: `₹${totalSpend.toLocaleString()}`, col: "#6366f1", ico: TrendingUp },
          { label: "Avg per Expense", val: `₹${Math.round(avgExpense).toLocaleString()}`, col: "#a855f7", ico: CreditCard },
          { label: "Across Groups", val: uniqueGroups.toString(), col: "#22d3ee", ico: Users },
        ].map(s => (
          <motion.div key={s.label} className="snd-card" variants={fadeUp}
            style={{ padding: "18px 20px", perspective: 1000 }}
            whileHover={{
              rotateX: 10, rotateY: 10, scale: 1.02,
              boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${s.col}22`,
              transition: { duration: .2 }
            }}
          >
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: `radial-gradient(ellipse 80% 60% at 10% 20%,${s.col}12,transparent 70%)`
            }} />
            <s.ico size={16} color={s.col} style={{ marginBottom: 10 }} />
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: "1.3rem", fontWeight: 500,
              color: s.col, lineHeight: 1, marginBottom: 4
            }}>{s.val}</div>
            <div style={{ fontSize: ".72rem", color: "var(--text-3)" }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-3)", pointerEvents: "none"
          }} />
          <input
            className="snd-input"
            style={{ paddingLeft: 40, height: 42 }}
            placeholder="Search expenses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {allGroups.length > 0 && (
          <div style={{ position: "relative", minWidth: 160 }}>
            <Filter size={13} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-3)", pointerEvents: "none"
            }} />
            <select
              className="snd-select"
              style={{ height: 42, paddingLeft: 34, fontSize: ".85rem" }}
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
            >
              <option value="all">All Groups</option>
              {allGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Expense list */}
      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="snd-skel" style={{ height: 76, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="snd-card snd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🧾</div>
          <h3>{search || groupFilter !== "all" ? "No matching expenses" : "No expenses yet"}</h3>
          <p>
            {search || groupFilter !== "all"
              ? "Try a different search or filter."
              : "Add your first expense to a group to see it here."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="snd-card"
          style={{ padding: "6px 20px 20px", marginBottom: 40 }}
          variants={stagger} initial="hidden" animate="show"
        >
          {filtered.map((exp: any, i: number) => {
            const col = G_COLORS[i % G_COLORS.length];
            const splits = exp.expense_splits ?? [];
            const gEmoji = GROUP_EMOJIS[exp.groups?.type] ?? "💰";

            return (
              <motion.div key={exp.id} variants={fadeUp}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "15px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
                  cursor: "none"
                }}
                whileHover={{ x: 3, transition: { duration: .15 } }}
                onClick={() => exp.groups?.id && router.push(`/dashboard/groups/${exp.groups.id}`)}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${col}18`, border: `1px solid ${col}26`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem"
                }}>
                  {EXP_ICONS[i % EXP_ICONS.length]}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem", marginBottom: 3 }}>
                    {exp.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: ".73rem", color: "var(--text-3)" }}>
                      Paid by <span style={{ color: "#a5b4fc" }}>{exp.paid_by}</span>
                    </span>
                    {exp.groups?.name && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: ".7rem", padding: "1px 8px", borderRadius: 6,
                        background: `${col}12`, color: col, border: `1px solid ${col}1e`
                      }}>
                        {gEmoji} {exp.groups.name}
                      </span>
                    )}
                    <span style={{ fontSize: ".7rem", color: "var(--text-3)" }}>
                      {new Date(exp.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>
                  {splits.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {splits.slice(0, 4).map((s: any) => (
                        <span key={s.id} style={{
                          fontSize: ".63rem", padding: "2px 7px", borderRadius: 5,
                          background: `${col}0e`, color: col, border: `1px solid ${col}18`
                        }}>
                          {s.member_name} ₹{s.amount.toFixed(0)}
                        </span>
                      ))}
                      {splits.length > 4 && (
                        <span style={{ fontSize: ".63rem", color: "var(--text-3)" }}>
                          +{splits.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "1rem", fontWeight: 600, color: col
                  }}>
                    ₹{exp.amount.toLocaleString()}
                  </div>
                  <ChevronRight size={14} color="var(--text-3)" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
