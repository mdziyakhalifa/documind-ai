"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-7 py-4 bg-background border-b border-border">
      <div>
        <h1 className="font-semibold text-foreground text-[15px] leading-none">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground/70 font-medium tracking-wide">
          Llama 3.3 · 70B
        </span>
        <div className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Live
        </span>
      </div>
    </header>
  );
}
