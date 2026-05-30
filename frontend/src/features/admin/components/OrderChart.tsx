"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const DATA = [
  { day: "Пн", orders: 12, revenue: 38000 },
  { day: "Вт", orders: 19, revenue: 64000 },
  { day: "Ср", orders: 15, revenue: 48000 },
  { day: "Чт", orders: 25, revenue: 89000 },
  { day: "Пт", orders: 32, revenue: 112000 },
  { day: "Сб", orders: 45, revenue: 165000 },
  { day: "Вс", orders: 38, revenue: 135000 },
];

export function OrderChart() {
  return (
    <div className="w-full h-[320px] p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Динамика заказов и выручки за неделю
        </h3>
        <p className="text-[10px] text-slate-400">
          Показатели за текущие 7 дней с разбивкой по выручке и количеству
        </p>
      </div>

      <div className="flex-1 min-h-0 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-lg backdrop-blur-sm text-[10px] flex flex-col gap-1.5 transition-colors">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        День: {payload[0].payload.day}
                      </p>
                      <p className="text-violet-600 dark:text-violet-400 font-semibold">
                        💰 Выручка: {payload[0].payload.revenue.toLocaleString()} ₽
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        📦 Заказов: {payload[0].payload.orders} шт.
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOrders)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
