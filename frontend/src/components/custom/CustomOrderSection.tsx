"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const CustomOrderSection: React.FC = () => {
  return (
    <section
      id="custom-order"
      className={cn(
        "py-20 bg-[#FDFDFD] border-t border-[#E8F0EA]/30",
        "grid place-items-center"
      )}
    >
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#1E3F20]/10 text-[#1E3F20] text-sm font-semibold tracking-wider uppercase rounded-full">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Индивидуальный заказ
        </div>
        <h2 className="text-3xl font-black text-[#1E3F20]">
          Мы создадим букет специально для вас
        </h2>
        <p className="text-[#2D2D2D]/70 text-base leading-relaxed">
          Опишите свои пожелания – цветовую гамму, тип цветов, бюджет.
          Наши флористы подберут идеальный вариант и свяжутся с вами для уточнения деталей.
        </p>
        <a
          href="/custom-order"
          className={cn(
            "inline-flex items-center gap-2.5 px-10 py-4.5 bg-[#0C3322] hover:bg-[#051A11] text-[#FDFDFD] font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg shadow-[#0C3322]/10 hover:shadow-[#0C3322]/20 active:scale-95",
            "group"
          )}
        >
          <span>Оформить индивидуальный заказ</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
};
