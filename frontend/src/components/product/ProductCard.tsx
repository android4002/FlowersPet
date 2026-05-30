"use client";

import React from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { Price } from "../shared/Price";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export interface ProductCardProps {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string;
  stock?: number;
  rating?: number;
  reviewsCount?: number;
  className?: string;
  onAddToCart?: (id: number) => void;
  onFavoriteToggle?: (id: number) => void;
  isFavorite?: boolean;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  discountPrice,
  imageUrl,
  stock = 0,
  rating,
  reviewsCount,
  className,
  onAddToCart,
  onFavoriteToggle,
  isFavorite = false,
  onClick,
}) => {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  
  const [isAdding, setIsAdding] = React.useState(false);

  const isOutOfStock = stock <= 0;
  const hasDiscount = discountPrice !== undefined && discountPrice !== null && discountPrice < price;
  const discountPercentage = hasDiscount ? Math.round(((price - discountPrice!) / price) * 100) : 0;

  const cartItem = items.find((item) => item.product.id === id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isInCart = quantityInCart > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      setIsAdding(true);
      setTimeout(() => setIsAdding(false), 500);

      // Add to cart safely without double additions
      if (onAddToCart) {
        onAddToCart(id);
      } else {
        addItem({
          id,
          name,
          description,
          price,
          discountPrice,
          imageUrl,
          stock,
          rating,
          reviewsCount,
        });
      }
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(id);
    }
  };

  return (
    <article 
      onClick={onClick}
      className={cn(
        "group relative flex flex-col bg-[#FDFDFD] border border-[#E8F0EA] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#1E3F20]/20 hover:-translate-y-0.5 transition-all duration-300 w-full overflow-hidden cursor-pointer",
        isAdding && "border-[#D4AF37] scale-[0.98] shadow-md shadow-[#D4AF37]/10 duration-200",
        className
      )}
      aria-label={`Товар: ${name}`}
    >
      {/* Favorite Button & Badges */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "p-2 bg-[#FDFDFD]/90 backdrop-blur-sm border border-[#E8F0EA] rounded-full shadow-sm text-[#2D2D2D]/60 hover:text-red-500 hover:bg-[#FDFDFD] active:scale-95 transition-all",
            isFavorite && "text-red-500 bg-[#FDFDFD]"
          )}
          aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
          type="button"
        >
          <Heart className={cn("w-4 h-4 transition-transform", isFavorite && "fill-current scale-110")} />
        </button>
      </div>

      {hasDiscount && (
        <div className="absolute top-6 left-6 z-10 px-2.5 py-1 bg-[#D4AF37] text-[#FDFDFD] text-xs font-black uppercase tracking-wider rounded-lg shadow-sm">
          -{discountPercentage}%
        </div>
      )}

      {/* Image Container */}
      <div className="aspect-[4/5] w-full rounded-xl bg-[#E8F0EA]/50 relative overflow-hidden mb-4 shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1E3F20]/20">
            <span className="text-sm font-medium">Нет фото</span>
          </div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#FDFDFD]/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-2 bg-[#2D2D2D] text-[#FDFDFD] text-xs font-bold uppercase tracking-wider rounded-lg">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <h3 className="font-bold text-[#1E3F20] text-base mb-1 tracking-tight line-clamp-1 group-hover:text-[#1E3F20]/80 transition-colors">
          {name}
        </h3>
        
        {description && (
          <p className="text-xs text-[#2D2D2D]/60 leading-relaxed mb-4 line-clamp-2 min-h-[2rem]">
            {description}
          </p>
        )}

        {/* Price & Buy Button Footer */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-[#E8F0EA]/55">
          <div className="flex flex-col gap-1 text-left">
            <Price price={price} discountPrice={discountPrice} />
            {rating !== undefined && (
              <div className="flex items-center gap-1 text-[11px] text-[#2D2D2D]/60 font-semibold select-none">
                <span className="text-[#D4AF37]">★</span>
                <span>{rating.toFixed(1)}</span>
                {reviewsCount !== undefined && (
                  <span className="text-[#2D2D2D]/40 font-normal">({reviewsCount})</span>
                )}
              </div>
            )}
          </div>
          
          {isInCart ? (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center bg-[#E8F0EA] border border-[#1E3F20]/15 rounded-xl overflow-hidden shrink-0 select-none shadow-sm animate-scale-up"
            >
              <button
                onClick={() => {
                  if (quantityInCart === 1) {
                    removeItem(id);
                  } else {
                    updateQuantity(id, quantityInCart - 1);
                  }
                }}
                className="px-3 py-2 text-[#1E3F20] hover:bg-[#1E3F20]/10 font-black text-xs transition-all active:scale-90"
                type="button"
                aria-label="Уменьшить количество"
              >
                —
              </button>
              <span className="px-2 text-xs font-black text-[#1E3F20] min-w-[20px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={() => {
                  if (quantityInCart < stock) {
                    // Trigger pulse on quantity increase
                    setIsAdding(true);
                    setTimeout(() => setIsAdding(false), 200);

                    updateQuantity(id, quantityInCart + 1);
                  } else {
                    alert(`Доступно всего ${stock} шт. на складе.`);
                  }
                }}
                className="px-3 py-2 text-[#1E3F20] hover:bg-[#1E3F20]/10 font-black text-xs transition-all active:scale-90"
                type="button"
                aria-label="Увеличить количество"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                "flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0C3322] hover:bg-[#051A11] text-[#FDFDFD] font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer select-none animate-scale-up",
                isOutOfStock && "bg-[#2D2D2D]/20 text-[#2D2D2D]/40 cursor-not-allowed hover:bg-[#2D2D2D]/20 active:scale-100"
              )}
              aria-label={isOutOfStock ? "Товар закончился" : `Купить ${name} и добавить в корзину`}
              type="button"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>В корзину</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
