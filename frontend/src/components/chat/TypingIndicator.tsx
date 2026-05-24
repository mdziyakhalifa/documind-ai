"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3.5">
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-lg bg-warm flex items-center justify-center shadow-soft">
          <span className="text-[10px] font-bold text-white">AI</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-card border border-border rounded-xl shadow-soft h-[42px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}
