"use client";

import React, { useState, useEffect } from "react";
import { X, Heart, ShoppingCart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, useCart } from "@/context/CartContext";
import { Price } from "../shared/Price";
import { cn } from "@/lib/utils";

interface ProductDetailsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: () => void;
  onFavoriteToggle: () => void;
  isFavorite: boolean;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onFavoriteToggle,
  isFavorite,
}) => {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdding, setIsAdding] = React.useState(false);

  const cartItem = items.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isInCart = quantityInCart > 0;

  // Lock body scroll when modal is open
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

  // Reset image index when modal changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product, isOpen]);

  // Support escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use product images array or fallback to main imageUrl
  const images = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl || "/images/products/placeholder.jpg"];

  const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price;
  const isOutOfStock = product.stock <= 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      setIsAdding(true);
      setTimeout(() => setIsAdding(false), 500);

      // Add to cart safely without double additions
      if (onAddToCart) {
        onAddToCart();
      } else {
        addItem(product);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={`Детали товара: ${product.name}`}
    >
      {/* Dark backdrop with smooth blur */}
      <div
        className="fixed inset-0 bg-[#0D1F0E]/50 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={cn(
          "relative w-full max-w-4xl bg-[#FDFDFD] border border-[#E8F0EA] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] z-10 animate-scale-up transition-all duration-300",
          isAdding && "border-[#D4AF37] scale-[0.99] shadow-md shadow-[#D4AF37]/10"
        )}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 bg-[#FDFDFD]/80 backdrop-blur-sm border border-[#E8F0EA] rounded-full text-[#2D2D2D]/60 hover:text-[#1E3F20] hover:bg-[#E8F0EA]/45 transition-all shadow-sm active:scale-90"
          aria-label="Закрыть детали товара"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Photo Carousel Grid */}
        <div className="relative w-full md:w-1/2 bg-[#E8F0EA]/25 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#E8F0EA] select-none min-h-[300px] md:min-h-0">
          
          {/* Main Image Slider */}
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-[#E8F0EA]/30">
            <img
              src={images[currentImageIndex]}
              alt={`${product.name} - фото ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Carousel navigation chevrons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-[#FDFDFD]/95 hover:bg-[#1E3F20] hover:text-[#FDFDFD] text-[#1E3F20] rounded-full shadow transition-all active:scale-90 cursor-pointer"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#FDFDFD]/95 hover:bg-[#1E3F20] hover:text-[#FDFDFD] text-[#1E3F20] rounded-full shadow transition-all active:scale-90 cursor-pointer"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}

            {/* Out of Stock banner overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-[#FDFDFD]/80 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-5 py-2.5 bg-[#2D2D2D] text-[#FDFDFD] text-xs font-bold uppercase tracking-wider rounded-xl shadow-md">
                  Нет в наличии
                </span>
              </div>
            )}

            {/* Discount Badge */}
            {hasDiscount && !isOutOfStock && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-[#D4AF37] text-[#FDFDFD] text-xs font-black uppercase tracking-wider rounded-xl shadow-sm select-none">
                -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 select-none">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                    currentImageIndex === index
                      ? "bg-[#1E3F20] scale-125 px-2"
                      : "bg-[#1E3F20]/20 hover:bg-[#1E3F20]/45"
                  )}
                  aria-label={`Перейти к фото ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Specifications and details */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-full">
          
          <div className="space-y-5 text-left">
            
            {/* Rating Stars & Reviews */}
            <div className="flex items-center gap-1.5 select-none">
              <div className="flex text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(product.rating || 4.8)
                        ? "fill-current"
                        : "opacity-30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-[#1E3F20]">
                {product.rating || 4.8}
              </span>
              <span className="text-xs text-[#2D2D2D]/45 font-medium">
                ({product.reviewsCount || 10} отзывов)
              </span>
            </div>

            {/* Product Name */}
            <h3 className="text-2xl font-black text-[#1E3F20] tracking-tight leading-tight">
              {product.name}
            </h3>

            {/* Price */}
            <div className="py-2 border-b border-[#E8F0EA]">
              <Price price={product.price} discountPrice={product.discountPrice} className="text-2xl" />
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#2D2D2D]/75 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Specifications / Details Table */}
            {product.details && Object.keys(product.details).length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black uppercase text-[#1E3F20]/60 tracking-widest select-none">
                  Характеристики
                </h4>
                <div className="border border-[#E8F0EA] rounded-2xl overflow-hidden shadow-sm">
                  {Object.entries(product.details).map(([key, val], index) => (
                    <div
                      key={key}
                      className={cn(
                        "grid grid-cols-5 text-xs py-3 px-4 leading-normal items-baseline",
                        index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#E8F0EA]/15",
                        index !== Object.keys(product.details!).length - 1 && "border-b border-[#E8F0EA]/55"
                      )}
                    >
                      <span className="col-span-2 font-bold text-[#1E3F20]/75">{key}</span>
                      <span className="col-span-3 text-[#2D2D2D]/85 font-medium text-right sm:text-left">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Section */}
          <div className="mt-8 pt-6 border-t border-[#E8F0EA] flex items-center gap-3 select-none">
            
            {/* Add to Cart / Quantity Selector */}
            {isInCart ? (
              <div className="flex-grow flex items-center justify-between bg-[#E8F0EA] border border-[#1E3F20]/15 rounded-xl overflow-hidden select-none shadow-sm h-14 animate-scale-up">
                <button
                  onClick={() => {
                    if (quantityInCart === 1) {
                      removeItem(product.id);
                    } else {
                      updateQuantity(product.id, quantityInCart - 1);
                    }
                  }}
                  className="px-6 h-full text-[#1E3F20] hover:bg-[#1E3F20]/10 font-black text-sm transition-all active:scale-90"
                  type="button"
                  aria-label="Уменьшить количество"
                >
                  —
                </button>
                <span className="text-sm font-black text-[#1E3F20] min-w-[30px] text-center">
                  В корзине: {quantityInCart} шт.
                </span>
                <button
                  onClick={() => {
                    if (quantityInCart < product.stock) {
                      setIsAdding(true);
                      setTimeout(() => setIsAdding(false), 200);

                      updateQuantity(product.id, quantityInCart + 1);
                    } else {
                      alert(`Доступно всего ${product.stock} шт. на складе.`);
                    }
                  }}
                  className="px-6 h-full text-[#1E3F20] hover:bg-[#1E3F20]/10 font-black text-sm transition-all active:scale-90"
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
                  "flex-grow flex items-center justify-center gap-2 py-4 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md shadow-[#1E3F20]/15 active:scale-[0.98] transition-all cursor-pointer select-none animate-scale-up",
                  isOutOfStock && "bg-[#2D2D2D]/20 text-[#2D2D2D]/40 cursor-not-allowed hover:bg-[#2D2D2D]/20 active:scale-100 shadow-none"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? "Нет на складе" : "Добавить в корзину"}</span>
              </button>
            )}

            {/* Favorite button toggle */}
            <button
              onClick={onFavoriteToggle}
              className={cn(
                "p-4 bg-[#E8F0EA]/45 hover:bg-[#FDFDFD] border border-transparent hover:border-red-500/10 text-[#1E3F20] hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-90 cursor-pointer",
                isFavorite && "text-red-500 bg-[#FDFDFD] border-red-500/15"
              )}
              aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
            >
              <Heart className={cn("w-5 h-5 transition-transform", isFavorite && "fill-current scale-110")} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
