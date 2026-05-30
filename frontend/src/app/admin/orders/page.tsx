"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrdersList } from "@/features/admin/orders/actions";
import { Order } from "@/features/admin/orders/types";
import { OrdersTable } from "@/features/admin/orders/components/OrdersTable";
import { OrderSheet } from "@/features/admin/orders/components/OrderSheet";
import { 
  Receipt, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from "lucide-react";

function AdminOrdersPageInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrdersList();
      setOrders(data);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // открыть заказ по ?order=ID — срабатывает и при первом рендере и при навигации
  useEffect(() => {
    const orderId = searchParams.get("order");
    if (!orderId) return;
    // убираем параметр из URL сразу чтобы при обновлении не открывалось снова
    router.replace("/admin/orders");
    if (orders.length > 0) {
      const found = orders.find((o) => String(o.id) === orderId);
      if (found) {
        setSelectedOrder(found);
        setIsSheetOpen(true);
      }
    } else {
      fetchOrders().then((data) => {
        const found = data.find((o) => String(o.id) === orderId);
        if (found) {
          setSelectedOrder(found);
          setIsSheetOpen(true);
        }
      });
    }
  }, [searchParams]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  // Aggregated quick stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => ["pending", "processing", "delivering"].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const totalRevenue = orders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full min-h-screen text-slate-800 dark:text-slate-100">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Receipt className="h-5 w-5 text-violet-600" />
            <span>Управление заказами</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
            Контролируйте статусы сборки, доставки и печать чеков на одной панели
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-850 shadow-sm transition-all hover:shadow"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          <span>Обновить</span>
        </button>
      </div>

      {/* Dynamic Visual Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-2xl border border-violet-500/10 text-white shadow-lg shadow-violet-600/10">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <TrendingUp className="h-28 w-28 text-white" />
          </div>
          <span className="text-[10px] font-bold text-violet-200/90 tracking-widest uppercase">
            Общая выручка
          </span>
          <h3 className="text-2xl font-black mt-2">
            {totalRevenue.toLocaleString()} ₽
          </h3>
          <p className="text-[10px] text-violet-200/80 font-bold tracking-wide uppercase mt-1">
            Исключая отмененные
          </p>
        </div>

        {/* Card 2: Active Orders */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Clock className="h-28 w-28" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Активные в работе
          </span>
          <h3 className="text-2xl font-black mt-2 text-slate-800 dark:text-slate-100">
            {activeOrders}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold tracking-wide uppercase mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Требуют внимания</span>
          </div>
        </div>

        {/* Card 3: Completed Orders */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <CheckCircle className="h-28 w-28" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Выполненные заказы
          </span>
          <h3 className="text-2xl font-black mt-2 text-slate-800 dark:text-slate-100">
            {completedOrders}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold tracking-wide uppercase mt-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Доставлено успешно</span>
          </div>
        </div>

        {/* Card 4: Total Orders */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Receipt className="h-28 w-28" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            Всего оформлено
          </span>
          <h3 className="text-2xl font-black mt-2 text-slate-800 dark:text-slate-100">
            {totalOrders}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
            За весь период
          </p>
        </div>

      </div>

      {/* Main orders table list view */}
      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <RefreshCw className="h-8 w-8 text-violet-600 animate-spin mb-4" />
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wide">
            Загрузка списка заказов...
          </span>
        </div>
      ) : (
        <OrdersTable 
          orders={orders} 
          onRefresh={fetchOrders} 
          onSelectOrder={handleSelectOrder}
          initialSearch={searchParams.get("phone") ?? ""}
        />
      )}

      {/* Slide-over Detailed Panel */}
      <OrderSheet 
        order={selectedOrder} 
        isOpen={isSheetOpen} 
        onClose={() => {
          setIsSheetOpen(false);
          setSelectedOrder(null);
        }} 
      />

    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPageInner />
    </Suspense>
  );
}
