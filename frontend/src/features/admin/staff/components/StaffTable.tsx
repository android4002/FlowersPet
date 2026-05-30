"use client";

import { useState } from "react";
import { Staff } from "../types";
import { toggleStaffAccess } from "../actions";
import { SendMessageModal } from "./SendMessageModal";
import { MessageSquare, ShieldCheck, ShieldAlert, UserCheck, UserX } from "lucide-react";

interface StaffTableProps {
  staffList: Staff[];
  onRefresh: () => void;
}

export function StaffTable({ staffList, onRefresh }: StaffTableProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const handleToggle = async (chatId: number, currentStatus: boolean) => {
    await toggleStaffAccess(chatId, currentStatus);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Сотрудники Telegram и управление доступом
        </h3>
        <p className="text-[10px] text-slate-400">
          Управляйте правами персонала Telegram в реальном времени. Блокировка срабатывает мгновенно.
        </p>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Сотрудник</th>
              <th className="pb-3">Telegram ID</th>
              <th className="pb-3">Системная роль</th>
              <th className="pb-3">Активность в боте</th>
              <th className="pb-3">Панель в боте</th>
              <th className="pb-3 text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                {/* Username */}
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  @{staff.username}
                </td>

                {/* Chat ID */}
                <td className="py-3 text-slate-500 font-mono">
                  {staff.chat_id}
                </td>

                {/* Role */}
                <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">
                  {staff.role}
                </td>

                {/* Last activity */}
                <td className="py-3 text-slate-400 italic">
                  {staff.last_activity}
                </td>

                {/* Toggle Button Access */}
                <td className="py-3">
                  <button
                    onClick={() => handleToggle(staff.chat_id, staff.is_active)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      staff.is_active
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                        : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                    }`}
                  >
                    {staff.is_active ? (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Доступ разрешен</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Доступ забанен</span>
                      </>
                    )}
                  </button>
                </td>

                {/* Actions */}
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* Send Telegram Message Button */}
                    <button
                      onClick={() => setSelectedStaff(staff)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 text-[10px] font-semibold transition-all"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Написать</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Message Modal Overlay */}
      {selectedStaff && (
        <SendMessageModal
          chatId={selectedStaff.chat_id}
          username={selectedStaff.username}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
