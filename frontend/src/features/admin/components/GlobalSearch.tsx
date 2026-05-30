"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, Hash, ShoppingBag, X, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  type: "order" | "product";
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  href: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Новый",    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  processing: { label: "В сборке", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  delivering: { label: "В пути",   color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  completed:  { label: "Выполнен", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  cancelled:  { label: "Отменён",  color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
};

interface GlobalSearchProps {
  theme: "light" | "dark";
}

export function GlobalSearch({ theme }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/v1/admin/orders/"),
        fetch("/api/v1/products/?limit=100"),
      ]);

      const allResults: SearchResult[] = [];
      const ql = q.toLowerCase();

      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        for (const o of orders) {
          if (
            String(o.id).includes(ql) ||
            o.customer_name?.toLowerCase().includes(ql) ||
            o.phone?.includes(q)
          ) {
            const st = STATUS_LABELS[o.status] ?? { label: o.status, color: "" };
            allResults.push({
              id: `order-${o.id}`,
              type: "order",
              title: `Заказ #${o.id} — ${o.customer_name}`,
              subtitle: `${o.phone} • ${o.total_amount.toLocaleString()} ₽`,
              badge: st.label,
              badgeColor: st.color,
              href: `/admin/orders?order=${o.id}`,
            });
          }
        }
      }

      if (productsRes.ok) {
        const products = await productsRes.json();
        for (const p of products) {
          if (p.name?.toLowerCase().includes(ql)) {
            allResults.push({
              id: `product-${p.id}`,
              type: "product",
              title: p.name,
              subtitle: `В наличии: ${p.stock} шт. • ${p.base_price.toLocaleString()} ₽`,
              badge: p.is_active ? "Активен" : "Скрыт",
              badgeColor: p.is_active
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
              href: `/admin/inventory?product=${p.id}`,
            });
          }
        }
      }

      setResults(allResults.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    router.push(item.href);
  };

  const overlay = open ? (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#C5A880]/20 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Header */}
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30">
            {loading
              ? <Loader2 className="h-5 w-5 text-[#C5A880] mr-3 animate-spin" />
              : <Search className="h-5 w-5 text-[#C5A880] mr-3" />
            }
            <input
              ref={inputRef}
              type="text"
              placeholder="Введите номер заказа, телефон или название товара..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-0 focus:border-0"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-[#C5A880]/10 hover:text-[#C5A880] text-slate-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results Body */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            {!query ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                Начните вводить текст для поиска. Например:{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[10px]">#30</code>{" "}
                или{" "}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[10px]">+7</code>
              </div>
            ) : loading ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Поиск...
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Совпадений не найдено. Попробуйте другой запрос.
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#C5A880]/10 dark:hover:bg-[#C5A880]/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-[#C5A880]/10 dark:bg-[#C5A880]/20">
                        {item.type === "order"
                          ? <Hash className="h-4 w-4 text-[#D4AF37]" />
                          : <ShoppingBag className="h-4 w-4 text-[#C5A880]" />
                        }
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Keyboard shortcuts */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-950/60 text-[10px] text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1 rounded bg-slate-200 dark:bg-slate-800">↑↓</kbd> Навигация</span>
              <span><kbd className="px-1 rounded bg-slate-200 dark:bg-slate-800">Enter</kbd> Выбрать</span>
            </div>
            <span><kbd className="px-1 rounded bg-slate-200 dark:bg-slate-800">ESC</kbd> Закрыть</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Search Button in Header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-72 h-9 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-400 text-xs hover:border-[#C5A880] dark:hover:border-[#C5A880]/60 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-[1.01] transition-all shadow-sm duration-200"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[#C5A880]" />
          <span>Поиск по админке...</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-500">
          ⌘K
        </kbd>
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
