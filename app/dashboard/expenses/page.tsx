"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, Tag } from "lucide-react";
import { fetchAllExpenses, G_COLORS } from "@/src/lib/supabase";

const fire = (msg: string, type: "ok" | "err" = "ok") =>
  window.dispatchEvent(new CustomEvent("snd-toast", { detail: { msg, type } }));

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } as const }
};

const stagger = { show: { transition: { staggerChildren: .05 } } };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllExpenses();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = expenses.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.groups?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="snd-content">
      <div className="snd-page-hdr">
        <div>
          <h1 style={{
            fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-.5px",
            color: "var(--text-1)"
          }}>
            All Expenses
          </h1>
          <p style={{ fontSize: ".82rem", color: "var(--text-2)", marginTop: 4, fontWeight: 500 }}>
            {loading ? "Loading..." : `${expenses.length} total transactions`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input 
              className="snd-input" 
              placeholder="Search..." 
              style={{ width: 220, paddingLeft: 34, height: 38, fontSize: ".85rem", border: "1.5px solid var(--border)" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="snd-skel" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="snd-card snd-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🧾</div>
          <h3>No expenses found</h3>
          <p>Your transactions will appear here once you add them to a group.</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "grid", gap: 12 }}>
          {filtered.map((e, i) => {
            const col = G_COLORS[i % G_COLORS.length];
            return (
              <motion.div 
                key={e.id} 
                className="snd-card" 
                variants={fadeUp}
                whileHover={{ x: 6, background: "var(--glass-hover)", borderColor: `${col}40` }}
                style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "none" }}
              >
                <div style={{ 
                  width: 44, height: 44, borderRadius: 12, background: `${col}15`, 
                  display: "flex", alignItems: "center", justifyContent: "center", color: col, flexShrink: 0
                }}>
                  <Receipt size={20} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-1)", transition: "color 0.2s" }}>
                    {e.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: ".78rem", color: "var(--text-2)", fontWeight: 500, transition: "color 0.2s" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: col, fontWeight: 700 }}>
                      <Tag size={11} /> {e.groups?.name || "General"}
                    </span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-2)", fontWeight: 600 }}>
                      <Calendar size={11} /> {new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: col, marginBottom: 2, fontFamily: "'DM Mono',monospace" }}>
                    ₹{e.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: ".85rem", color: "var(--text-2)", fontWeight: 600, transition: "color 0.2s" }}>
                    Paid by {e.paid_by}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
