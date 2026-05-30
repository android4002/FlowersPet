"use client";

import React, { useEffect } from "react";
import { X, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Price } from "../shared/Price";
import { useCart, Product } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface FavoritesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onFavoriteToggle: (id: number) => void;
  products: Product[];
}

export const FavoritesSheet: React.FC<FavoritesSheetProps> = ({
  isOpen,
  onClose,
  favorites,
  onFavoriteToggle,
  products,
}) => {
  const { addItem } = useCart();
  
  // Find favorited products
  const favoritedProducts = products.filter((p) => favorites.includes(p.id));

  // Disable body scroll when sidebar is open to lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Support Escape key to close the drawer for accessibility (a11y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay with Fade transition */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-[#0D1F0E]/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-none opacity-0",
          isOpen && "opacity-100 pointer-events-auto"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Sidebar Container with Slide transition */}
      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-md bg-[#FDFDFD] border-l border-[#E8F0EA] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-x-full",
          isOpen && "translate-x-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Избранные товары"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E8F0EA] flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-500">
            <Heart className="w-5 h-5 fill-current" />
            <h2 className="text-lg font-black tracking-tight uppercase text-[#1E3F20]">Избранное</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#2D2D2D]/60 hover:text-red-500 hover:bg-[#E8F0EA]/45 rounded-xl active:scale-95 transition-all focus:outline-none"
            aria-label="Закрыть избранное"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Favorites List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {favoritedProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-[#E8F0EA]/40 text-red-500/30 rounded-2xl flex items-center justify-center border border-[#E8F0EA]">
                <Heart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E3F20] text-base mb-1">Список пуст</h3>
                <p className="text-xs text-[#2D2D2D]/55 max-w-[200px]">
                  Добавляйте товары в избранное, чтобы они появились здесь
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-xs font-bold text-[#1E3F20] hover:underline"
              >
                Вернуться к каталогу
              </button>
            </div>
          ) : (
            favoritedProducts.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 p-4 border border-[#E8F0EA] rounded-2xl bg-[#FDFDFD] hover:border-red-500/15 transition-all shadow-sm"
              >
                {/* Product Image */}
                <div className="w-16 h-20 rounded-xl bg-[#E8F0EA]/50 relative overflow-hidden flex items-center justify-center shrink-0">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#1E3F20]/35 select-none">Цветы</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-grow flex flex-col justify-between min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[#1E3F20] text-sm tracking-tight truncate pr-1">
                      {product.name}
                    </h4>
                    <button
                      onClick={() => onFavoriteToggle(product.id)}
                      className="p-1 text-[#2D2D2D]/40 hover:text-red-500 rounded-lg active:scale-90 transition-all shrink-0"
                      aria-label={`Удалить ${product.name} из избранного`}
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Price & Add to Cart Controls */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8F0EA]/45 mt-2">
                    <Price price={product.price} discountPrice={product.discountPrice} />
                    
                    <button
                      onClick={() => {
                        addItem(product);
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-[10px] rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                      aria-label={`Купить ${product.name}`}
                      type="button"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Купить</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};
