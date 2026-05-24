"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isStreaming,
  disabled,
  placeholder = "Ask anything about your documents…",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="pb-6 pt-2">
      <div className={cn(
        "relative bg-card border rounded-2xl shadow-card transition-all duration-200",
        canSend ? "border-warm/40" : "border-border"
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isStreaming || disabled}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none px-5 pt-4 pb-14 text-sm outline-none leading-relaxed"
          style={{ maxHeight: "180px" }}
        />

        {/* Bottom bar */}
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
          {isStreaming ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating…
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/35 select-none">
              ⏎ to send · shift+⏎ new line
            </span>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
              canSend
                ? "bg-warm text-white hover:bg-warm/90 shadow-soft"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
