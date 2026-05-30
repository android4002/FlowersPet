"use client";

import { useEffect, useState } from "react";
import { Order } from "../types";
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Flower2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { getOrderReceiptUrl, updateCustomOrderPrice } from "../actions";

interface OrderSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderSheet({ order, isOpen, onClose }: OrderSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [compiledName, setCompiledName] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [savingCustomDetails, setSavingCustomDetails] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (order && order.items[0]?.product_id === 0) {
      setCompiledName(order.items[0].name || "Индивидуальный букет под заказ");
      setFinalPrice(order.items[0].price ? order.items[0].price.toString() : "");
    } else {
      setCompiledName("");
      setFinalPrice("");
    }
    setUpdateSuccess(false);
  }, [order, isOpen]);

  const handleSaveCustomOrderDetails = async () => {
    if (!order || !finalPrice) return;
    setSavingCustomDetails(true);
    setUpdateSuccess(false);
    try {
      const ok = await updateCustomOrderPrice(order.id, Number(finalPrice), compiledName);
      if (ok) {
        setUpdateSuccess(true);
        // We will trigger a refresh or let the user close/refresh manually
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCustomDetails(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  const statusConfig = {
    pending: { label: "⏳ В ожидании", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    processing: { label: "⚙️ В сборке", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    delivering: { label: "🚚 В доставке", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    completed: { label: "✅ Выполнен", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    cancelled: { label: "❌ Отменен", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  };

  interface TimelineStep {
    title: string;
    desc: string;
    time: string;
    done: boolean;
    error?: boolean;
  }

  const getTimelineSteps = (status: Order["status"], dateStr: string): TimelineStep[] => {
    const date = new Date(dateStr);
    const formatDate = (offsetMins: number) => {
      const d = new Date(date.getTime() + offsetMins * 60000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    const steps: TimelineStep[] = [
      {
        title: "Заказ оформлен",
        desc: "Покупатель оформил заказ в боте",
        time: formatDate(0),
        done: true,
      },
      {
        title: "Передан флористу",
        desc: "Началась сборка и оформление композиции",
        time: formatDate(10),
        done: ["processing", "delivering", "completed"].includes(status),
      },
      {
        title: "Передан курьеру",
        desc: "Букет передан в службу доставки",
        time: formatDate(35),
        done: ["delivering", "completed"].includes(status),
      },
      {
        title: "Успешно доставлен",
        desc: "Заказ передан получателю лично в руки",
        time: formatDate(60),
        done: status === "completed",
      }
    ];

    if (status === "cancelled") {
      return [
        steps[0],
        {
          title: "Заказ отменен",
          desc: "Заказ отменен администратором",
          time: formatDate(5),
          done: true,
          error: true
        }
      ];
    }

    return steps;
  };

  const currentStatus = order ? statusConfig[order.status] : null;
  const timelineSteps = order ? getTimelineSteps(order.status, order.created_at) : [];

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Content Container */}
      <div className={`relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                Заказ #{order?.id}
              </h2>
              {order && currentStatus && (
                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
              Подробная информация о заказе
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all border border-slate-200/40 dark:border-slate-700/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
          
          {/* Customer Info Card */}
          <div className="bg-slate-50/50 dark:bg-slate-950/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-violet-500" />
              <span>Покупатель</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-semibold">Имя клиента</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{order?.customer_name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 font-semibold">Телефон</span>
                <a href={`tel:${order?.phone}`} className="font-bold text-violet-600 hover:underline flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order?.phone}
                </a>
              </div>
              {order?.email && (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 font-semibold">Email</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {order.email}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-slate-400 font-semibold">Адрес доставки</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{order?.address || "Самовывоз из салона"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ordered items list or Custom Bouquet details */}
          <div>
            {order?.items[0]?.product_id === 0 ? (
              <div className="space-y-5">
                {/* 1. Custom order specs card */}
                <div className="p-5 rounded-2xl border border-violet-500/15 bg-violet-500/5 text-xs flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-wider">
                    <Sparkles className="h-4.5 w-4.5 text-violet-600" />
                    <span>Параметры индивидуального букета</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Повод</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{order.items[0].occasion || "Не указан"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Бюджет</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-450 text-xs">{order.items[0].budget || "Любой"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Цветовые предпочтения</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {Array.isArray(order.items[0].colors) ? order.items[0].colors.join(", ") : (order.items[0].colors || "Любые")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Пожелания клиента</span>
                      <p className="font-semibold text-slate-650 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850/80 leading-relaxed text-xs">
                        «{order.items[0].wishes || "Нет особых пожеланий"}»
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Agreed Pricing Calculator Form */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ Расчет стоимости и состава
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Флорист собирает букет и согласовывает цену с клиентом. Укажите финальные данные ниже:
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wide">Название композиции</label>
                      <input
                        type="text"
                        value={compiledName}
                        onChange={(e) => setCompiledName(e.target.value)}
                        placeholder="Например: Авторский букет с пионами и розами Libertad"
                        className="w-full mt-1.5 p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-semibold"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <label className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wide">Итоговая цена (₽)</label>
                      <input
                        type="number"
                        value={finalPrice}
                        onChange={(e) => setFinalPrice(e.target.value)}
                        placeholder="Укажите цену"
                        className="w-full mt-1.5 p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-black text-violet-600 dark:text-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {updateSuccess && (
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/15 animate-bounce">
                      ✓ Успешно сохранено! Цена согласована, клиенту отправлено пуш-уведомление.
                    </div>
                  )}

                  <button
                    onClick={handleSaveCustomOrderDetails}
                    disabled={savingCustomDetails || !finalPrice}
                    className="w-full sm:w-fit inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow shadow-slate-950/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {savingCustomDetails ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Синхронизация...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Утвердить и уведомить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Flower2 className="h-3.5 w-3.5 text-violet-500" />
                  <span>Состав заказа</span>
                </h3>
                <div className="space-y-2">
                  {order?.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-black">
                          🌸
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {item.price.toLocaleString()} ₽ × {item.quantity} шт
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {item.line_total.toLocaleString()} ₽
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 rounded-xl bg-violet-600/5 border border-violet-600/10 mt-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Итого к оплате:</span>
                    <span className="text-base font-black text-violet-600 dark:text-violet-400">
                      {order?.total_amount.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline / Status History changes */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-violet-500" />
              <span>История изменений статусов</span>
            </h3>
            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-5 space-y-5 py-1">
              {timelineSteps.map((step, idx) => {
                const isError = step.error;
                return (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      isError 
                        ? "bg-rose-500 border-rose-500 text-white" 
                        : step.done 
                          ? "bg-violet-600 border-violet-600 text-white" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-755"
                    }`}>
                      {step.done && !isError && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {isError && <AlertTriangle className="h-2.5 w-2.5" />}
                    </span>

                    {/* Step details */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          isError 
                            ? "text-rose-600 dark:text-rose-400" 
                            : step.done 
                              ? "text-slate-800 dark:text-slate-200" 
                              : "text-slate-400"
                        }`}>
                          {step.title}
                        </span>
                        {step.done && (
                          <span className="text-[9px] text-slate-400 font-semibold">{step.time}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3">
          <a
            href={order ? getOrderReceiptUrl(order.id) : "#"}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 transition-all text-center"
          >
            <FileText className="h-4 w-4" />
            Печать чека / накладной (PDF)
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
