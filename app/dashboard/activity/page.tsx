"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Plus, Receipt, UserPlus, Clock } from "lucide-react";
import { fetchAllExpenses, fetchGroups } from "@/src/lib/supabase";

const fadeUp: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

const stagger: any = { show: { transition: { staggerChildren: .06 } } };

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [expenses, groups] = await Promise.all([
      fetchAllExpenses(),
      fetchGroups()
    ]);

    // Combine and sort by date
    const combined = [
      ...expenses.map(e => ({
        id: e.id,
        type: "expense",
        title: e.title,
        detail: `Added to ${e.groups?.name || "a group"}`,
        amount: e.amount,
        date: new Date(e.created_at),
        icon: Receipt,
        color: "#6366f1"
      })),
      ...groups.map(g => ({
        id: g.id,
        type: "group",
        title: g.name,
        detail: "Group created",
        date: new Date(g.created_at),
        icon: Plus,
        color: "#a855f7"
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    setActivities(combined);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="snd-content">
      <div className="snd-page-hdr">
        <div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.4px",
            background: "linear-gradient(135deg,#f1f0ff,#a5b4fc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Recent Activity
          </h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4 }}>
            Stay updated with your group's latest movements
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 20, paddingLeft: 20, borderLeft: "2px solid rgba(255,255,255,.05)" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="snd-skel" style={{ height: 60, borderRadius: 12 }} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="snd-card snd-empty">
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>
          <h3>No activity yet</h3>
          <p>Your group actions and expenses will be tracked here.</p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* Vertical line */}
          <div style={{ 
            position: "absolute", left: 7, top: 10, bottom: 10, width: 2, 
            background: "linear-gradient(to bottom, rgba(99,102,241,.3), rgba(168,85,247,.3), transparent)" 
          }} />

          <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "grid", gap: 30 }}>
            {activities.map((a) => (
              <motion.div key={a.id} variants={fadeUp} style={{ position: "relative" }}>
                {/* Dot */}
                <div style={{ 
                  position: "absolute", left: -21, top: 5, width: 10, height: 10, 
                  borderRadius: "50%", background: a.color, border: "2px solid var(--bg-1)",
                  boxShadow: `0 0 10px ${a.color}80`
                }} />

                <div className="snd-card" style={{ padding: "16px 18px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ 
                      width: 36, height: 36, borderRadius: 10, background: `${a.color}15`, 
                      display: "flex", alignItems: "center", justifyContent: "center", color: a.color, flexShrink: 0 
                    }}>
                      <a.icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text-1)", transition: "color 0.2s" }}>{a.title}</span>
                        <span style={{ fontSize: ".7rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}>
                          <Clock size={10} /> {a.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div style={{ fontSize: ".8rem", color: "var(--text-2)", transition: "color 0.2s" }}>
                        {a.detail} {a.amount !== undefined && <span style={{ color: "var(--text-1)", fontWeight: 600 }}>• ₹{a.amount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
