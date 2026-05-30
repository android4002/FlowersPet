"use client";

import React, { useEffect, useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Price } from "../shared/Price";
import { OrderForm } from "../checkout/OrderForm";
import { cn } from "@/lib/utils";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSheet: React.FC<CartSheetProps> = ({ isOpen, onClose }) => {
  const { items, cartTotal, updateQuantity, removeItem, clearCart } = useCart();
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);

  // Disable body scroll when sidebar is open to lock background
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

  // Reset checkout mode when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setIsCheckoutMode(false);
    }
  }, [isOpen]);

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
        aria-label="Корзина покупок"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E8F0EA] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1E3F20]">
            {isCheckoutMode ? (
              <button
                onClick={() => setIsCheckoutMode(false)}
                className="p-1 text-[#2D2D2D]/60 hover:text-[#1E3F20] hover:bg-[#E8F0EA]/45 rounded-xl transition-all mr-1"
                aria-label="Вернуться в корзину"
                type="button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <ShoppingBag className="w-5 h-5" />
            )}
            <h2 className="text-lg font-black tracking-tight uppercase">
              {isCheckoutMode ? "Оформление" : "Корзина"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#2D2D2D]/60 hover:text-[#1E3F20] hover:bg-[#E8F0EA]/45 rounded-xl active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/30"
            aria-label="Закрыть корзину"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Content List / Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isCheckoutMode ? (
            <OrderForm onSuccessClose={() => {
              setIsCheckoutMode(false);
              onClose();
            }} />
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-[#E8F0EA]/40 text-[#1E3F20]/30 rounded-2xl flex items-center justify-center border border-[#E8F0EA]">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E3F20] text-base mb-1">Ваша корзина пуста</h3>
                <p className="text-xs text-[#2D2D2D]/55 max-w-[200px]">
                  Добавьте товары из каталога, чтобы начать покупки
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-xs font-bold text-[#1E3F20] hover:underline"
              >
                Вернуться к покупкам
              </button>
            </div>
          ) : (
            items.map((item) => {
              const activePrice =
                item.product.discountPrice !== null &&
                item.product.discountPrice !== undefined &&
                item.product.discountPrice < item.product.price
                  ? item.product.discountPrice
                  : item.product.price;

              return (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 border border-[#E8F0EA] rounded-2xl bg-[#FDFDFD] hover:border-[#1E3F20]/15 transition-all shadow-sm group"
                >
                  {/* Item Image */}
                  <div className="w-16 h-20 rounded-xl bg-[#E8F0EA]/50 relative overflow-hidden flex items-center justify-center shrink-0">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-[#1E3F20]/35 select-none">Цветы</span>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-[#1E3F20] text-sm tracking-tight truncate pr-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1 text-[#2D2D2D]/40 hover:text-red-500 rounded-lg active:scale-90 transition-all shrink-0"
                        aria-label={`Удалить ${item.product.name} из корзины`}
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity controls & Price */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8F0EA]/45 mt-2">
                      {/* Counter Controls */}
                      <div className="flex items-center border border-[#E8F0EA] rounded-lg bg-[#FDFDFD] overflow-hidden select-none">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-[#2D2D2D]/60 hover:text-[#1E3F20] hover:bg-[#E8F0EA]/40 active:scale-95 transition-all"
                          aria-label="Уменьшить количество на 1"
                          type="button"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-black text-[#1E3F20]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-[#2D2D2D]/60 hover:text-[#1E3F20] hover:bg-[#E8F0EA]/40 active:scale-95 transition-all"
                          aria-label="Увеличить количество на 1"
                          type="button"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total price */}
                      <Price price={activePrice * item.quantity} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {!isCheckoutMode && items.length > 0 && (
          <div className="p-6 border-t border-[#E8F0EA] bg-[#E8F0EA]/15 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-[#2D2D2D]/60 uppercase tracking-wider">
                Итого к оплате
              </span>
              <Price price={cartTotal} className="text-xl" />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsCheckoutMode(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md shadow-[#1E3F20]/15 active:scale-95 transition-all group cursor-pointer"
                type="button"
              >
                <span>Оформить заказ</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2.5 border border-red-500/10 hover:border-red-500/30 text-red-500 hover:bg-red-500/5 font-semibold text-xs rounded-xl transition-all"
                type="button"
              >
                Очистить корзину
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
