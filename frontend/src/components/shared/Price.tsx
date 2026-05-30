import React from "react";
import { cn } from "@/lib/utils";

interface PriceProps {
  price: number;
  discountPrice?: number | null;
  className?: string;
}

export const Price: React.FC<PriceProps> = ({ price, discountPrice, className }) => {
  // Format price as Russian Ruble in ru-RU locale without decimal places
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasDiscount = discountPrice !== undefined && discountPrice !== null && discountPrice < price;

  return (
    <div className={cn("flex items-baseline gap-2 font-sans", className)}>
      {hasDiscount ? (
        <>
          <span 
            className="font-extrabold text-[#1E3F20] text-lg" 
            aria-label={`Цена со скидкой: ${formatCurrency(discountPrice!)}`}
          >
            {formatCurrency(discountPrice!)}
          </span>
          <span 
            className="text-sm text-[#2D2D2D]/40 line-through" 
            aria-label={`Обычная цена: ${formatCurrency(price)}`}
          >
            {formatCurrency(price)}
          </span>
        </>
      ) : (
        <span 
          className="font-extrabold text-[#1E3F20] text-lg" 
          aria-label={`Цена: ${formatCurrency(price)}`}
        >
          {formatCurrency(price)}
        </span>
      )}
    </div>
  );
};
