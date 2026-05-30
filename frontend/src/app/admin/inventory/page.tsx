"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/features/admin/inventory/types";
import { getProductsList } from "@/features/admin/inventory/actions";
import { ProductDataTable } from "@/features/admin/inventory/components/ProductDataTable";
import { DragSortList } from "@/features/admin/inventory/components/DragSortList";
import { CreateProductModal } from "@/features/admin/inventory/components/CreateProductModal";
import { Layers, Plus, ArrowUpDown } from "lucide-react";

function InventoryPageInner() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "sort">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialEditProduct, setInitialEditProduct] = useState<Product | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const refreshData = async () => {
    try {
      const data = await getProductsList();
      setProducts(data);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  useEffect(() => {
    refreshData().then((data) => {
      const productId = searchParams.get("product");
      if (productId) {
        const found = data.find((p) => String(p.id) === productId);
        if (found) setInitialEditProduct(found);
        // убираем параметр из URL чтобы при обновлении не открывалось снова
        router.replace("/admin/inventory");
      }
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            📦 Управление складом и каталогом товаров
          </h2>
          <p className="text-xs text-slate-400">
            Мониторинг складских остатков, управление ценами и сортировка витрины магазина
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C5A880] hover:bg-[#bfa075] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#C5A880]/10"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Создать товар</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold tracking-wide transition-all ${
            activeTab === "list"
              ? "border-[#C5A880] text-[#C5A880] dark:text-[#C5A880]/90"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Складской инвентарь</span>
        </button>

        <button
          onClick={() => setActiveTab("sort")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold tracking-wide transition-all ${
            activeTab === "sort"
              ? "border-[#C5A880] text-[#C5A880] dark:text-[#C5A880]/90"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>Сортировка витрины сайта</span>
        </button>
      </div>

      {/* Render Active Tab */}
      <div className="w-full">
        {activeTab === "list" ? (
          <ProductDataTable
            products={products}
            onRefresh={refreshData}
            initialEditProduct={initialEditProduct}
          />
        ) : (
          <DragSortList products={products} onRefresh={refreshData} />
        )}
      </div>

      {/* Product Creation Modal */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onRefresh={refreshData}
        />
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageInner />
    </Suspense>
  );
}
