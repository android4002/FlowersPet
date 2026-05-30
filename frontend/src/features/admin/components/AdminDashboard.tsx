"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const OrderChart = dynamic(
  () => import("./OrderChart").then((mod) => mod.OrderChart),
  { ssr: false }
);

import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Coins, 
  RefreshCw, 
  Send, 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  UserCheck 
} from "lucide-react";


interface RecentOrder {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: "pending" | "processing" | "ready" | "completed";
  statusLabel: string;
  statusColor: string;
}

const RECENT_ORDERS: RecentOrder[] = [
  { id: "#3401", customer: "Александр Г.", items: "Букет «Нежность» x1", total: 4500, status: "processing", statusLabel: "В сборке", statusColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  { id: "#3402", customer: "Мария В.", items: "101 Красная Роза x1", total: 12000, status: "completed", statusLabel: "Доставлен", statusColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { id: "#3403", customer: "Елена С.", items: "Букет «Весеннее настроение» x2", total: 6400, status: "pending", statusLabel: "Новый", statusColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" }
];

export function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    active_orders: 0,
    new_clients: 0,
    total_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const fetchStatsAndStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/analytics/daily-stats");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setStats(data);

      const prodRes = await fetch("/api/v1/products/?limit=100");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const count = prodData.filter((p: any) => p.stock <= 0).length;
        setOutOfStockCount(count);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndStaff();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Vercel-like Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-900">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C5A880] animate-pulse" />
            <span>Панель управления FlowersPET</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Операционный аудит продаж, складские остатки и показатели мастерской «Планета цветов»
          </p>
        </div>
        <button
          onClick={fetchStatsAndStaff}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-[#C5A880]/30 text-xs font-bold rounded-xl text-slate-750 dark:text-slate-250 transition-all shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Синхронизировать</span>
        </button>
      </div>

      {/* Modern Sleek Minimalist Stats Grid - Warm Nude Palette */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Revenue */}
        <div className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-850 shadow-sm hover:border-[#C5A880]/30 transition-all duration-300">
          <div className="absolute right-4 top-4 h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <Coins className="h-5 w-5 text-[#C5A880]" />
          </div>
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 tracking-widest uppercase">
            Выручка за сегодня
          </span>
          <h2 className="text-2xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">
            {stats.revenue.toLocaleString()} ₽
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] text-[#C5A880] dark:text-[#E8D8C8] font-extrabold bg-[#C5A880]/10 px-2 py-0.5 rounded-full border border-[#C5A880]/20 w-fit mt-4">
            <TrendingUp className="h-3 w-3" />
            <span>Мастерская в Иванове</span>
          </div>
        </div>

        {/* Metric 2: Active Orders */}
        <div className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-850 shadow-sm hover:border-[#C5A880]/30 transition-all duration-300">
          <div className="absolute right-4 top-4 h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 tracking-widest uppercase">
            Активные заказы
          </span>
          <h2 className="text-2xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">
            {stats.active_orders} букетов
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] text-[#D4AF37] dark:text-[#D4AF37] font-extrabold bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20 w-fit mt-4">
            <span>В сборке / доставке</span>
          </div>
        </div>

        {/* Metric 3: Out of stock count */}
        <div className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-850 shadow-sm hover:border-[#C5A880]/30 transition-all duration-300">
          <div className="absolute right-4 top-4 h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <Radio className="h-5 w-5 text-rose-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500 tracking-widest uppercase">
            Товары вне склада
          </span>
          <h2 className="text-2xl font-black mt-2 text-slate-900 dark:text-white tracking-tight">
            {outOfStockCount} позиций
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] text-rose-600 dark:text-rose-400 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 w-fit mt-4">
            <span>Требуется закупка</span>
          </div>
        </div>
      </div>

      {/* Main Charts area taking full width */}
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          <OrderChart />
        </div>
      </div>

      {/* Bottom Grid: Live orders taking full width */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Recent Orders Overview */}
        <div className="w-full p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-855 dark:text-slate-100 uppercase tracking-wider">
              Последние заказы в реальном времени
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Оперативный мониторинг новых поступлений заказов
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <th className="pb-3 w-16">ID заказа</th>
                  <th className="pb-3">Клиент</th>
                  <th className="pb-3">Состав</th>
                  <th className="pb-3">Сумма</th>
                  <th className="pb-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">{order.id}</td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 font-semibold">{order.customer}</td>
                    <td className="py-3.5 text-slate-500 truncate max-w-[200px]">{order.items}</td>
                    <td className="py-3.5 font-black text-slate-800 dark:text-slate-200">{order.total.toLocaleString()} ₽</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full ${order.statusColor.replace("violet", "amber")}`}>
                        {order.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
