"use client";

import { useState } from "react";
import { Product } from "../types";
import { updateProductPrice, updateProductStock, updateProductDetails, deleteProduct } from "../actions";
import { AlertCircle, CheckCircle, Search, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditProductModal } from "./EditProductModal";

interface ProductDataTableProps {
  products: Product[];
  onRefresh: () => void;
  initialEditProduct?: Product | null;
}

export function ProductDataTable({ products, onRefresh, initialEditProduct = null }: ProductDataTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [editingField, setEditingField] = useState<{ id: string; field: "base_price" | "discount_price" | "stock" } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(initialEditProduct);

  const handleStartEdit = (id: string, field: "base_price" | "discount_price" | "stock", currentVal: number | null) => {
    setEditingField({ id, field });
    setEditValue(currentVal !== null ? currentVal.toString() : "");
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;
    const { id, field } = editingField;
    const numValue = Number(editValue);

    if (isNaN(numValue) || numValue < 0) {
      alert("Введите целое неотрицательное число");
      setEditingField(null);
      return;
    }

    try {
      if (field === "base_price") {
        await updateProductPrice(id, numValue);
      } else if (field === "stock") {
        await updateProductStock(id, numValue);
      } else if (field === "discount_price") {
        await updateProductDetails(id, { discount_price: numValue });
      }
      onRefresh();
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Ошибка обновления значения");
    } finally {
      setEditingField(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateProductDetails(id, { is_active: !currentActive });
      onRefresh();
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Вы действительно хотите безвозвратно удалить товар "${product.name}"?`);
    if (!confirmed) return;

    try {
      const success = await deleteProduct(product.id);
      if (success) {
        onRefresh();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      alert("Не удалось удалить товар");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm animate-fade-in">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Live Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-850">
          {["All", "Букеты", "Комнатные", "Суккуленты"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                categoryFilter === cat
                  ? "bg-[#C5A880] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {cat === "All" ? "Все категории" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3">Главное фото</th>
              <th className="pb-3">Название</th>
              <th className="pb-3">Категория</th>
              <th className="pb-3">Базовая цена</th>
              <th className="pb-3">Скидка</th>
              <th className="pb-3">Остаток</th>
              <th className="pb-3 text-center">Статус</th>
              <th className="pb-3 text-right pr-4">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Товары не найдены
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isLowStock = product.stock < 5;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    {/* Cover image */}
                    <td className="py-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                      />
                    </td>

                    {/* Name */}
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {product.name}
                    </td>

                    {/* Category */}
                    <td className="py-3 text-slate-500">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {product.category}
                      </span>
                    </td>

                    {/* Interactive base_price Cell */}
                    <td className="py-3">
                      {editingField?.id === product.id && editingField.field === "base_price" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-20 px-2 py-1 text-xs border border-[#C5A880] rounded bg-white dark:bg-slate-950 focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(product.id, "base_price", product.base_price)}
                          className="flex items-center gap-1.5 group cursor-pointer font-bold text-slate-800 dark:text-slate-200 hover:text-[#C5A880] dark:hover:text-[#C5A880]/85 transition-colors"
                        >
                          <span>{product.base_price.toLocaleString()} ₽</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Interactive discount_price Cell */}
                    <td className="py-3">
                      {editingField?.id === product.id && editingField.field === "discount_price" ? (
                        <input
                          type="text"
                          value={editValue}
                          placeholder="Нет"
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-20 px-2 py-1 text-xs border border-[#C5A880] rounded bg-white dark:bg-slate-950 focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(product.id, "discount_price", product.discount_price)}
                          className="flex items-center gap-1.5 group cursor-pointer font-bold text-slate-600 dark:text-slate-300 hover:text-[#C5A880] dark:hover:text-[#C5A880]/85 transition-colors"
                        >
                          <span>{product.discount_price !== null ? `${product.discount_price.toLocaleString()} ₽` : "Нет"}</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Interactive Stock Cell */}
                    <td className="py-3">
                      {editingField?.id === product.id && editingField.field === "stock" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-20 px-2 py-1 text-xs border border-[#C5A880] rounded bg-white dark:bg-slate-950 focus:outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => handleStartEdit(product.id, "stock", product.stock)}
                          className={`flex items-center gap-1.5 group cursor-pointer font-bold transition-colors ${
                            isLowStock 
                              ? "text-rose-600 dark:text-rose-400" 
                              : "text-slate-800 dark:text-slate-200 hover:text-[#C5A880] dark:hover:text-[#C5A880]/85"
                          }`}
                        >
                          <span>{product.stock} шт.</span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </div>
                      )}
                    </td>

                    {/* Status Toggle (is_active) Indicator (🟢 / 🔴) */}
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(product.id, product.is_active)}
                        className="text-base select-none cursor-pointer focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                        title={product.is_active ? "Активен (Клик для деактивации)" : "Неактивен (Клик для активации)"}
                      >
                        {product.is_active ? "🟢" : "🔴"}
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#C5A880] text-slate-500 hover:text-[#C5A880] dark:hover:text-[#C5A880]/85 bg-white dark:bg-slate-950 transition-colors"
                          title="Редактировать товар / Описание"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Удалить товар"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onRefresh={() => {
            onRefresh();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
