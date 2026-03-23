"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9, rotate: -5 }}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        cursor: "none",
        color: "var(--accent)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: 45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: -45 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </motion.div>
      </AnimatePresence>
      
      {/* Background glow effect */}
      <motion.div
        className="toggle-glow"
        initial={false}
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: "absolute",
          inset: -4,
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          zIndex: -1,
          pointerEvents: "none"
        }}
      />
    </motion.button>
  );
}
