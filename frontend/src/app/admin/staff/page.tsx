"use client";

import { useState, useEffect } from "react";
import { Staff, AdminActionLog } from "@/features/admin/staff/types";
import { getStaffList, getAdminActionLogs } from "@/features/admin/staff/actions";
import { StaffTable } from "@/features/admin/staff/components/StaffTable";
import { ActionLogs } from "@/features/admin/staff/components/ActionLogs";
import { Users, History } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [activeTab, setActiveTab] = useState<"staff" | "logs">("staff");

  const refreshData = async () => {
    const list = await getStaffList();
    const actionsList = await getAdminActionLogs();
    setStaff(list);
    setLogs(actionsList);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          👑 Управление персоналом и аудит безопасности
        </h2>
        <p className="text-xs text-slate-400">
          Контролируйте доступ к Telegram боту и просматривайте историю всех системных действий администраторов
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold tracking-wide transition-all ${
            activeTab === "staff"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Сотрудники Telegram</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold tracking-wide transition-all ${
            activeTab === "logs"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Логи действий</span>
        </button>
      </div>

      {/* Active Tab */}
      <div className="w-full">
        {activeTab === "staff" ? (
          <StaffTable staffList={staff} onRefresh={refreshData} />
        ) : (
          <ActionLogs logs={logs} />
        )}
      </div>
    </div>
  );
}
