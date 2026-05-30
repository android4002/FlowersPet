"use client";

import { AdminActionLog } from "../types";
import { Info, History } from "lucide-react";

interface ActionLogsProps {
  logs: AdminActionLog[];
}

export function ActionLogs({ logs }: ActionLogsProps) {
  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Лог административных действий (Security Logs)
          </h3>
          <p className="text-[10px] text-slate-400">
            Аудит безопасности всех критических изменений цен, товаров и доступов персонала
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Время операции</th>
              <th className="pb-3">Администратор</th>
              <th className="pb-3">Раздел / Действие</th>
              <th className="pb-3">Детализация изменений</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  История действий пуста
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  {/* Timestamp */}
                  <td className="py-3 font-semibold text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString("ru-RU")}
                  </td>

                  {/* Admin Name */}
                  <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                    {log.admin_name}
                  </td>

                  {/* Action Group */}
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/30">
                      {log.action}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3 text-slate-400">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
