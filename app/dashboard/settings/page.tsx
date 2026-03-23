"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Globe, CreditCard, LogOut, ChevronRight } from "lucide-react";
import { getCurrentProfile, type Profile, supabase, updateProfile } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
};

const stagger = { show: { transition: { staggerChildren: .06 } } };

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);


  useEffect(() => {
    getCurrentProfile().then(p => {
      setProfile(p);
      setEditName(p?.full_name || "");
      setLoading(false);
    });
  }, []);

  const handleUpdate = async () => {
    if (!editName.trim() || !profile) return;
    setUpdating(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateProfile({ full_name: editName });
      setProfile(updated);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Update failed:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleItemClick = (label: string) => {
    if (label === "Profile Information") {
      setIsEditing(true);
      profileRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // Add other cases as needed
  };


  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/landing/auth");
  };

  const SETTINGS_SECTIONS = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile Information", sub: "Name, email, and avatar", color: "#6366f1" },
        { icon: Shield, label: "Security", sub: "Password and authentication", color: "#a855f7" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Globe, label: "Language & Currency", sub: "English (IN), INR (₹)", color: "#10b981" },
        { icon: Bell, label: "Notifications", sub: "Email and push alerts", color: "#f59e0b" },
      ]
    },
    {
      title: "Billing",
      items: [
        { icon: CreditCard, label: "Subscription", sub: "Free plan", color: "#ec4899" },
      ]
    }
  ];

  return (
    <div className="snd-content">
      <div className="snd-page-hdr">
        <div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-.4px",
            background: "linear-gradient(135deg,#f1f0ff,#a5b4fc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Settings
          </h1>
          <p style={{ fontSize: ".8rem", color: "var(--text-3)", marginTop: 4 }}>
            Manage your account and app preferences
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 20 }}>
          <div className="snd-skel" style={{ height: 100, borderRadius: 16 }} />
          <div className="snd-skel" style={{ height: 250, borderRadius: 16 }} />
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: "grid", gap: 32 }}>
          
          {/* User Profile Summary */}
          <motion.div ref={profileRef} variants={fadeUp} className="snd-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: 20, 
              background: "linear-gradient(135deg,#6366f1,#a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.5rem", fontWeight: 800, color: "#fff",
              boxShadow: "0 8px 16px rgba(99,102,241,0.2)"
            }}>
              {profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "SN"}
            </div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <>
                  <input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ 
                      fontSize: "1.1rem", fontWeight: 700, background: "rgba(255,255,255,0.08)", 
                      border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.2)", 
                      borderRadius: 8, padding: "4px 12px",
                      color: "#fff", width: "100%", marginBottom: 4, outline: "none"
                    }}
                    autoFocus
                  />
                  {error && <p style={{ fontSize: ".7rem", color: "#f87171" }}>{error}</p>}
                </>
              ) : (
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>{profile?.full_name || "User Name"}</h3>
              )}
              <p style={{ fontSize: ".85rem", color: "var(--text-3)" }}>{profile?.email || "user@example.com"}</p>
            </div>
            {isEditing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => { setIsEditing(false); setError(""); }}
                  className="snd-btn-cancel" 
                  style={{ padding: "8px 16px", borderRadius: 10, fontSize: ".8rem" }}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  className="snd-btn-primary" 
                  style={{ 
                    padding: "8px 16px", borderRadius: 10, fontSize: ".8rem",
                    background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", border: "none",
                    opacity: (updating || editName === profile?.full_name) ? 0.6 : 1,
                    cursor: (updating || editName === profile?.full_name) ? "not-allowed" : "pointer"
                  }}
                  disabled={updating || editName === profile?.full_name}
                >
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                {success && <span style={{ color: "#34d399", fontSize: ".7rem" }}>Profile updated!</span>}
                <button 
                  onClick={() => setIsEditing(true)}
                  className="snd-btn-cancel" 
                  style={{ padding: "8px 16px", borderRadius: 10, fontSize: ".8rem" }}
                >
                  Edit
                </button>
              </div>
            )}

          </motion.div>

          {/* Sections */}
          {SETTINGS_SECTIONS.map((section, idx) => (
            <motion.div key={idx} variants={fadeUp}>
              <h2 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14, marginLeft: 4 }}>
                {section.title}
              </h2>
              <div className="snd-card" style={{ overflow: "hidden", padding: 0 }}>
                {section.items.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleItemClick(item.label)}
                    style={{ 
                      width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                      background: "transparent", border: "none", borderBottom: i === section.items.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)",
                      textAlign: "left"
                    }}
                    className="snd-nav-item" // Reusing styling for hover states
                  >
                    <div style={{ 
                      width: 36, height: 36, borderRadius: 10, background: `${item.color}25`, 
                      display: "flex", alignItems: "center", justifyContent: "center", color: item.color 
                    }}>
                      <item.icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--text-1)" }}>{item.label}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--text-3)" }}>{item.sub}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--text-3)" }} />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Logout */}
          <motion.div variants={fadeUp} style={{ marginTop: 8 }}>
            <button 
              onClick={logout}
              className="snd-card" 
              style={{ 
                width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                color: "#ef4444", fontWeight: 600, fontSize: ".9rem"
              }}
            >
              <LogOut size={18} />
              Logout from account
            </button>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
}
