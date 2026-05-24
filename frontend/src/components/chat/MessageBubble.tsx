"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { StreamingMessage } from "@/types";
import SourceCard from "./SourceCard";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: StreamingMessage;
  index: number;
}

export default function MessageBubble({ message, index }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[72%] bg-foreground text-background rounded-2xl rounded-br-sm px-5 py-3.5 shadow-soft">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="flex gap-3.5 group"
    >
      {/* AI mark */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-7 h-7 rounded-lg bg-warm flex items-center justify-center shadow-soft">
          <span className="text-[10px] font-bold text-white">AI</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="prose-chat text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const isBlock = !!(props as any).inline === false || match;
                return isBlock ? (
                  <SyntaxHighlighter
                    style={oneLight as any}
                    language={match?.[1] || "text"}
                    PreTag="div"
                    className="!rounded-xl !text-xs !my-3 !border !border-border"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>{children}</code>
                );
              },
            }}
          >
            {message.content || ""}
          </ReactMarkdown>

          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-warm/50 ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {!message.isStreaming && (
          <div className="mt-2.5 flex items-center gap-1">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all opacity-0 group-hover:opacity-100"
            >
              {copied ? (
                <><Check className="w-3 h-3 text-green-600" /><span className="text-green-600">Copied</span></>
              ) : (
                <><Copy className="w-3 h-3" />Copy</>
              )}
            </button>
          </div>
        )}

        {message.sources && message.sources.length > 0 && !message.isStreaming && (
          <SourceCard sources={message.sources} />
        )}
      </div>
    </motion.div>
  );
}
