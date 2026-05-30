"use client";

import { useState } from "react";
import { BotStatus } from "@/features/admin/components/BotStatus";
import { GlobalSearch } from "@/features/admin/components/GlobalSearch";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-100">
        {/* Collapsible Sidebar */}
        <AdminSidebar theme={theme} toggleTheme={toggleTheme} />

        {/* Core Layout Right */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Header Panel */}
          <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-300">
            {/* Global Cmd+K Search bar */}
            <GlobalSearch theme={theme} />

            {/* Telegram Bot API indicator */}
            <BotStatus />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto px-8 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
