"use client";

import { useState } from "react";
import { Order } from "../types";
import { updateOrderStatus, getOrderReceiptUrl } from "../actions";
import { Search, Eye, FileText, Filter } from "lucide-react";

interface OrdersTableProps {
  orders: Order[];
  onRefresh: () => void;
  onSelectOrder: (order: Order) => void;
  initialSearch?: string;
}

export function OrdersTable({ orders, onRefresh, onSelectOrder, initialSearch = "" }: OrdersTableProps) {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const statuses = [
    { value: "pending", label: "⏳ Новый", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
    { value: "processing", label: "⚙️ В сборке", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
    { value: "delivering", label: "🚚 В пути", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30" },
    { value: "completed", label: "✅ Выполнен", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
    { value: "cancelled", label: "❌ Отменен", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" }
  ];

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setLoadingId(orderId);
    try {
      const ok = await updateOrderStatus(orderId, newStatus);
      if (ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch = 
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.id.toString().includes(search);
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm animate-fade-in">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по имени, ID, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-850">
          <div className="flex items-center gap-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Статус:</span>
          </div>
          {["All", "pending", "processing", "delivering", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all uppercase shrink-0 ${
                statusFilter === st
                  ? "bg-[#C5A880] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {st === "All" ? "Все" : (statuses.find(s => s.value === st)?.label || st)}
            </button>
          ))}
        </div>

      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 w-16">Заказ ID</th>
              <th className="pb-3">Дата создания</th>
              <th className="pb-3">Клиент</th>
              <th className="pb-3">Телефон</th>
              <th className="pb-3">Сумма (₽)</th>
              <th className="pb-3">Статус заказа</th>
              <th className="pb-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Заказы не найдены
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const activeConfig = statuses.find((s) => s.value === order.status);
                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectOrder(order)}
                  >
                    {/* Order ID */}
                    <td className="py-3.5 font-black text-slate-800 dark:text-slate-200">
                      #{order.id}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString([], {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })} в {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                     {/* Customer */}
                    <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{order.customer_name}</span>
                        {order.items[0]?.product_id === 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-[#C5A880]/10 text-[#C5A880] dark:text-[#E8D8C8] border border-[#C5A880]/20 shadow-sm">
                            ✨ ИНД.
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 text-slate-500 font-medium">
                      {order.phone}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 font-black text-[#C5A880] dark:text-[#E8D8C8]">
                      {order.total_amount.toLocaleString()} ₽
                    </td>

                    {/* Status Dropdown/Selector */}
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <select
                          disabled={loadingId === order.id}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`w-36 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C5A880] uppercase ${
                            activeConfig?.color
                          } ${loadingId === order.id ? "opacity-50" : ""}`}
                        >
                          <option value="pending">⏳ Новый</option>
                          <option value="processing">⚙️ В сборке</option>
                          <option value="delivering">🚚 В пути</option>
                          <option value="completed">✅ Выполнен</option>
                          <option value="cancelled">❌ Отменен</option>
                        </select>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 border border-slate-200/40 dark:border-slate-700/50 transition-all"
                          title="Просмотреть детали"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={getOrderReceiptUrl(order.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 border border-slate-200/40 dark:border-slate-700/50 transition-all"
                          title="Печать чека"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
