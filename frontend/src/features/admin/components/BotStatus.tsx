"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function BotStatus() {
  const [status, setStatus] = useState<"online" | "offline">("online");
  const [ping, setPing] = useState<number>(45);

  useEffect(() => {
    // Simulate real-time checking of Telegram Bot API
    const interval = setInterval(() => {
      const isOnline = Math.random() > 0.05; // 95% online chance
      setStatus(isOnline ? "online" : "offline");
      setPing(isOnline ? Math.floor(30 + Math.random() * 30) : 0);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors">
      <span className="relative flex h-2.5 w-2.5">
        {status === "online" ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
        )}
      </span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {status === "online" ? (
          <span className="flex items-center gap-1">
            API Telegram: <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Online</span>
            <span className="text-[10px] text-slate-400 font-normal">({ping}ms)</span>
          </span>
        ) : (
          <span className="text-rose-600 dark:text-rose-400 font-bold">🔴 Offline</span>
        )}
      </span>
    </div>
  );
}
