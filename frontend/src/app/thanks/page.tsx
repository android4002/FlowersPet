import React from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowLeft, Heart, Flower2 } from "lucide-react";

export default function ThanksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD]">
      {/* Header (Minimal for thanks page) */}
      <header className="h-20 bg-[#FDFDFD] border-b border-[#E8F0EA] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded-xl bg-[#1E3F20] flex items-center justify-center text-[#D4AF37] shadow-sm">
            <Flower2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-black tracking-wider text-[#1E3F20] uppercase">
            Планета цветов
          </span>
        </Link>
      </header>

      {/* Main Thank You Message */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
        {/* Animated Check Icon */}
        <div className="w-20 h-20 bg-[#E8F0EA]/70 text-[#1E3F20] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#E8F0EA] animate-bounce">
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        </div>

        <h1 className="text-3xl font-black text-[#1E3F20] mb-3 tracking-tight">
          Спасибо за заказ!
        </h1>
        
        <p className="text-sm text-[#2D2D2D]/75 leading-relaxed mb-8">
          Ваш заказ успешно оформлен. Наш менеджер уже проверяет детали и свяжется с вами по указанному телефону в течение 5-10 минут для подтверждения доставки.
        </p>

        {/* Action Button */}
        <div className="w-full flex flex-col sm:flex-row gap-3 items-stretch justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md shadow-[#1E3F20]/15 active:scale-95 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Вернуться в магазин</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[#E8F0EA] text-center text-xs text-[#2D2D2D]/40">
        © {new Date().getFullYear()} Планета цветов. С любовью к вашим чувствам. <Heart className="w-3 h-3 inline text-red-500 fill-current ml-0.5" />
      </footer>
    </div>
  );
}
