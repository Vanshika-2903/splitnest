"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Motion values for mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for trailing effect
  const springConfig = { damping: 25, stiffness: 150 };
  const dotSpringConfig = { damping: 30, stiffness: 250 };
  
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);
  
  const dotX = useSpring(mouseX, dotSpringConfig);
  const dotY = useSpring(mouseY, dotSpringConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.closest("button") || 
        target.closest("a") || 
        target.closest("input") || 
        target.closest("select") || 
        target.closest("textarea") ||
        target.closest(".link") ||
        target.closest(".snd-nav-item") ||
        target.closest(".snd-card");
      
      setIsHovered(!!isInteractive);
    };

    const handleMouseLeaveWindow = () => setIsVisible(false);
    const handleMouseEnterWindow = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", () => setIsHovered(false));
    document.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.addEventListener("mouseenter", handleMouseEnterWindow);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.removeEventListener("mouseenter", handleMouseEnterWindow);
    };
  }, [mouseX, mouseY, isVisible]);

  // Global style to hide default cursor
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999]">
      {/* Outer Trailing Ring */}
      <motion.div
        style={{
          position: "fixed",
          left: ringX,
          top: ringY,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          width: isHovered ? 60 : 36,
          height: isHovered ? 60 : 36,
          backgroundColor: isHovered ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.05)",
          borderColor: isHovered ? "rgba(139, 92, 246, 0.6)" : "rgba(139, 92, 246, 0.3)",
          boxShadow: isHovered ? "0 0 20px rgba(139, 92, 246, 0.4)" : "0 0 0px rgba(139, 92, 246, 0)",
        }}
        className="rounded-full border-[1.5px] will-change-transform flex items-center justify-center"
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Glow Aura */}
        <motion.div 
           animate={{ scale: isHovered ? 1.5 : 1, opacity: isHovered ? 0.6 : 0.3 }}
           className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"
        />
      </motion.div>

      {/* Inner Dot */}
      <motion.div
        style={{
          position: "fixed",
          left: dotX,
          top: dotY,
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          backgroundColor: isHovered ? "#8b5cf6" : "#ffffff",
        }}
        className="w-2 h-2 rounded-full mix-blend-difference will-change-transform z-10"
      />
    </div>
  );
}
