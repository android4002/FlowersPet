"use client";

import React, { useState, useEffect, useRef } from "react";
import { Flower2, ShoppingBag, MapPin, Menu, X, Heart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/context/CartContext";

interface HeaderProps {
  cartItemCount?: number;
  onCartClick?: () => void;
  favoriteItemCount?: number;
  onFavoriteClick?: () => void;
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  products?: Product[];
  onProductSelect?: (product: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount = 0,
  onCartClick,
  favoriteItemCount = 0,
  onFavoriteClick,
  className,
  searchQuery = "",
  onSearchChange,
  products = [],
  onProductSelect,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [badgeBump, setBadgeBump] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Suggestions search logic
  const suggestions = searchQuery.trim() === ""
    ? []
    : products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  // Click outside to close suggestion popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Monitor scroll for header background styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Trigger animation bump when cart item count changes
  useEffect(() => {
    if (cartItemCount === 0) return;
    setBadgeBump(true);
    const timer = setTimeout(() => setBadgeBump(false), 300);
    return () => clearTimeout(timer);
  }, [cartItemCount]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-[#FDFDFD]/90 backdrop-blur-md shadow-sm border-b border-[#E8F0EA] h-16" 
          : "bg-transparent h-20",
        className
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        
        {/* Brand & Address */}
        <div className="flex items-center gap-4">
          <a 
            href="#" 
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/30 rounded-lg p-1"
            aria-label="Главная страница Планета цветов"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1E3F20] flex items-center justify-center text-[#D4AF37] shadow-sm">
              <Flower2 className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-wider text-[#1E3F20] uppercase leading-none">
                Планета цветов
              </span>
              <span className="text-[10px] text-[#2D2D2D]/40 font-bold tracking-wider leading-none mt-1">
                ФЛОРИСТИЧЕСКИЙ ГИПЕРМАРКЕТ
              </span>
            </div>
          </a>

          {/* Delivery Address (Hidden on mobile and desktop header, visible only in mobile drawer and footer) */}
          <div className="hidden items-center gap-1.5 px-3 py-1 bg-[#E8F0EA]/40 border border-[#E8F0EA] rounded-full text-[#2D2D2D]/60 select-none text-[11px] font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#1E3F20]" />
            <span>г. Иваново, пер. Пограничный, 80</span>
          </div>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav 
          className="hidden md:flex items-center gap-8 text-xs font-black text-[#0C3322] uppercase tracking-wider"
          aria-label="Главное меню"
        >
          <a href="#catalog" className="hover:text-[#FFD700] transition-colors p-1 rounded">Каталог</a>
          <a href="#about" className="hover:text-[#FFD700] transition-colors p-1 rounded">О компании</a>
          <a href="#delivery" className="hover:text-[#FFD700] transition-colors p-1 rounded">Доставка и оплата</a>
          <a href="#contacts" className="hover:text-[#FFD700] transition-colors p-1 rounded">Контакты</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input in Header */}
          <div ref={desktopSearchRef} className="relative hidden md:flex items-center w-48 lg:w-64 transition-all duration-300">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              placeholder="Поиск цветов..."
              className="w-full pl-8 pr-7 py-1.5 text-xs font-bold bg-[#E8F0EA]/45 hover:bg-[#E8F0EA]/60 border-[1.5px] border-[#0C3322] rounded-xl text-[#0C3322] focus:outline-none focus:bg-[#FDFDFD] transition-all placeholder-[#0C3322]/60"
              aria-label="Поиск по ассортименту"
            />
            <Search className="w-3.5 h-3.5 text-[#0C3322] absolute left-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange("");
                  setIsFocused(false);
                }}
                className="absolute right-2 p-0.5 bg-[#E8F0EA]/30 hover:bg-[#E8F0EA]/60 text-[#0C3322] rounded-full active:scale-90 transition-all"
                aria-label="Очистить поиск"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}

            {/* Desktop Autocomplete Popover Dropdown */}
            {isFocused && searchQuery.trim() !== "" && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#FDFDFD]/95 backdrop-blur-md border border-[#E8F0EA] rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-up py-2 max-h-[320px] overflow-y-auto w-[280px] lg:w-[320px]">
                <div className="px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#0C3322]/50 border-b border-[#E8F0EA]/55 mb-1.5 select-none">
                  Подходящие товары
                </div>
                {suggestions.map((product) => {
                  const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price;
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (onProductSelect) onProductSelect(product);
                        if (onSearchChange) onSearchChange("");
                        setIsFocused(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#E8F0EA]/30 transition-all text-left group"
                      type="button"
                    >
                      <div className="w-10 h-12 rounded-lg bg-[#E8F0EA]/30 overflow-hidden shrink-0 border border-[#E8F0EA]/50">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-[#0C3322] truncate group-hover:text-[#0C3322]/80 transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-black text-[#0C3322]">
                            {hasDiscount ? product.discountPrice : product.price} ₽
                          </span>
                          {hasDiscount && (
                            <span className="text-[9px] text-[#2D2D2D]/35 line-through">
                                {product.price} ₽
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Favorites Heart Trigger */}
          <button
            onClick={onFavoriteClick}
            className="group relative flex items-center justify-center p-2.5 bg-[#E8F0EA]/45 hover:bg-[#FDFDFD] text-[#0C3322] hover:text-red-500 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0C3322]/30 select-none border border-transparent hover:border-red-500/10"
            aria-label={`Избранное, ${favoriteItemCount} товаров`}
            type="button"
          >
            <Heart className={cn("w-5 h-5 transition-transform group-hover:scale-105", favoriteItemCount > 0 && "fill-red-500 text-red-500")} strokeWidth={2.5} />
            
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-[#FDFDFD] font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#FDFDFD] shadow-sm transition-transform duration-300 scale-0",
                favoriteItemCount > 0 && "scale-100"
              )}
              aria-hidden="true"
            >
              {favoriteItemCount}
            </span>
          </button>

          {/* Shopping Cart Trigger */}
          <button
            onClick={onCartClick}
            className="group relative flex items-center justify-center p-2.5 bg-[#E8F0EA]/45 hover:bg-[#0C3322] text-[#0C3322] hover:text-[#FDFDFD] rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0C3322]/30 select-none"
            aria-label={`Корзина, ${cartItemCount} товаров`}
            type="button"
          >
            <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-105" strokeWidth={2.5} />
            
            {/* Animated Items Count Badge */}
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 select-none pointer-events-none z-10" aria-hidden="true">
                {/* Backing glow ping that radiates outwards smoothly */}
                {badgeBump && (
                  <span className="absolute inset-0 bg-[#FFD700] rounded-full animate-ping opacity-75 -z-10 transform-gpu" />
                )}
                {/* Solid primary badge with smooth scale bump pop */}
                <span
                  className={cn(
                    "absolute inset-0 bg-[#FFD700] text-[#0C3322] font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[#FDFDFD] shadow-sm transition-transform duration-300 transform-gpu",
                    badgeBump ? "scale-125 duration-100" : "scale-100"
                  )}
                >
                  {cartItemCount}
                </span>
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-[#E8F0EA]/45 hover:bg-[#E8F0EA] text-[#2D2D2D] md:hidden rounded-xl active:scale-95 transition-all focus:outline-none"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileMenuOpen}
            type="button"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "absolute top-full left-0 w-full bg-[#FDFDFD] border-b border-[#E8F0EA] shadow-lg flex flex-col p-6 gap-4 md:hidden transition-all duration-300 origin-top transform scale-y-0 opacity-0 -z-50",
          isMobileMenuOpen && "scale-y-100 opacity-100 z-40"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#E8F0EA]/45 border border-[#E8F0EA] rounded-xl text-[#2D2D2D]/60 text-xs font-semibold select-none mb-1">
          <MapPin className="w-4 h-4 text-[#1E3F20]" />
          <span>г. Иваново, пер. Пограничный, 80</span>
        </div>

        {/* Mobile Search Bar */}
        <div ref={mobileSearchRef} className="relative flex items-center w-full mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              setIsMobileFocused(true);
            }}
            onFocus={() => setIsMobileFocused(true)}
            placeholder="Поиск цветов и растений..."
            className="w-full pl-9 pr-8 py-2.5 text-xs font-bold bg-[#E8F0EA]/30 border-[1.5px] border-[#0C3322] rounded-xl text-[#0C3322] focus:outline-none focus:bg-[#FDFDFD] transition-all placeholder-[#0C3322]/60"
            aria-label="Поиск по ассортименту мобильный"
          />
          <Search className="w-4 h-4 text-[#0C3322] absolute left-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => {
                if (onSearchChange) onSearchChange("");
                setIsMobileFocused(false);
              }}
              className="absolute right-2.5 p-1 bg-[#E8F0EA]/30 hover:bg-[#E8F0EA]/60 text-[#0C3322] rounded-full active:scale-90 transition-all"
              aria-label="Очистить поиск"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Mobile Suggestion Dropdown */}
          {isMobileFocused && searchQuery.trim() !== "" && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#FDFDFD] border border-[#E8F0EA] rounded-2xl shadow-lg overflow-hidden py-2 z-50 max-h-[250px] overflow-y-auto">
              {suggestions.map((product) => {
                const hasDiscount = product.discountPrice !== null && product.discountPrice !== undefined && product.discountPrice < product.price;
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (onProductSelect) onProductSelect(product);
                      if (onSearchChange) onSearchChange("");
                      setIsMobileFocused(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#E8F0EA]/30 transition-all text-left"
                    type="button"
                  >
                    <div className="w-9 h-11 rounded-lg bg-[#E8F0EA]/30 overflow-hidden shrink-0 border border-[#E8F0EA]/50">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-[#1E3F20] truncate">{product.name}</h4>
                      <span className="text-[11px] font-black text-[#1E3F20]">
                        {hasDiscount ? product.discountPrice : product.price} ₽
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <nav className="flex flex-col gap-3 font-semibold text-sm text-[#2D2D2D]">
          <a 
            href="#catalog" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 hover:bg-[#E8F0EA]/40 rounded-lg transition-all"
          >
            Каталог
          </a>
          <a 
            href="#about" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 hover:bg-[#E8F0EA]/40 rounded-lg transition-all"
          >
            О компании
          </a>
          <a 
            href="#delivery" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 hover:bg-[#E8F0EA]/40 rounded-lg transition-all"
          >
            Доставка и оплата
          </a>
          <a 
            href="#contacts" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 hover:bg-[#E8F0EA]/40 rounded-lg transition-all"
          >
            Контакты
          </a>
        </nav>
      </div>
    </header>
  );
};
