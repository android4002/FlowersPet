"use client";

import { useState, useEffect } from "react";
import { Product } from "../types";
import { updateProductsSortOrder } from "../actions";
import { GripVertical, CheckCircle2, ArrowUpDown } from "lucide-react";

interface DragSortListProps {
  products: Product[];
  onRefresh: () => void;
}

export function DragSortList({ products, onRefresh }: DragSortListProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems([...products].sort((a, b) => a.sort_order - b.sort_order));
  }, [products]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    
    // Create a ghost image or effect
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("opacity-40");
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Reorder array on the fly for immediate visual feedback
    const reordered = [...items];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setItems(reordered);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("opacity-40");
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const ids = items.map((item) => item.id);
      await updateProductsSortOrder(ids);
      onRefresh();
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении сортировки");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm transition-all hover:border-slate-150 dark:hover:border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 dark:border-slate-850/50 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowUpDown className="h-4.5 w-4.5 text-[#C5A880]" />
            <span>Интерактивная сортировка витрины</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Перетаскивайте карточки товаров вверх и вниз за маркер для изменения их порядка на основном сайте
          </p>
        </div>

        <div className="flex items-center gap-3">
          {showSavedToast && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/15 transition-all">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Порядок витрины успешно сохранен!</span>
            </div>
          )}
          <button
            onClick={handleSaveOrder}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black tracking-wide uppercase transition-all shadow shadow-slate-950/10 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить порядок"}
          </button>
        </div>
      </div>

      {/* Reorderable List */}
      <div className="flex flex-col gap-2.5 mt-2">
        {items.map((item, index) => {
          const isDragging = draggedIndex === index;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                isDragging
                  ? "border-violet-500 bg-violet-500/5 shadow-md shadow-violet-500/5 opacity-50 scale-[0.99] select-none"
                  : "border-slate-100 dark:border-slate-850/80 bg-slate-50/30 dark:bg-slate-950/20 hover:border-violet-550/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors">
                  <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-200" />
                </div>
                
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-10 w-10 rounded-lg object-cover border border-slate-100 dark:border-slate-850 shrink-0"
                />
                
                <div className="flex flex-col min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {item.category} • Остаток: {item.stock} шт • {item.price.toLocaleString()} ₽
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[9px] font-bold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                  Позиция #{index + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
