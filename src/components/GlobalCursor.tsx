"use client";

import React from "react";
import AnimatedCursor from "react-animated-cursor";

export default function GlobalCursor() {
  return (
    <AnimatedCursor
      innerSize={8}
      outerSize={35}
      innerScale={1}
      outerScale={2}
      outerAlpha={0}
      innerStyle={{ backgroundColor: "#fff", mixBlendMode: "difference" }}
      outerStyle={{ border: "2px solid rgba(255, 255, 255, 0.4)", mixBlendMode: "difference" }}
      clickables={[
        "a",
        'input[type="text"]',
        'input[type="email"]',
        'input[type="number"]',
        'input[type="submit"]',
        'input[type="image"]',
        "label[for]",
        "select",
        "textarea",
        "button",
        ".link",
        ".snd-nav-item",
        ".snd-card"
      ]}
    />
  );
}
