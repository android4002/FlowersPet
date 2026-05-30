"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Flower2, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const OCCASIONS = [
  "День рождения / Юбилей",
  "Свадьба / Помолвка",
  "Свидание / Романтика",
  "Знак благодарности",
  "Просто так / Без повода",
  "Другое"
];

const BUDGET_RANGES = [
  "до 3 000 ₽",
  "3 000 ₽ – 5 000 ₽",
  "5 000 ₽ – 10 000 ₽",
  "свыше 10 000 ₽"
];

const COLOR_SWATCHES = [
  { name: "Пастельный розовый", hex: "#FBCFE8" },
  { name: "Классический красный", hex: "#EF4444" },
  { name: "Белоснежный", hex: "#FFFFFF", border: true },
  { name: "Солнечный желтый", hex: "#FDE047" },
  { name: "Нежная лаванда", hex: "#DDD6FE" },
  { name: "Глубокий синий", hex: "#3B82F6" },
  { name: "Микс оттенков", gradient: "linear-gradient(45deg, #F87171, #FBBF24, #34D399, #60A5FA)" }
];

export default function CustomOrderPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [wishes, setWishes] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Phone Masking Logic (identical to order checkout)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");
    if (input.startsWith("7")) input = input.substring(1);
    if (input.startsWith("8")) input = input.substring(1);
    input = input.substring(0, 10);

    let formatted = "+7";
    if (input.length > 0) formatted += " (" + input.substring(0, 3);
    if (input.length >= 4) formatted += ") " + input.substring(3, 6);
    if (input.length >= 7) formatted += "-" + input.substring(6, 8);
    if (input.length >= 9) formatted += "-" + input.substring(8, 10);

    setPhone(formatted);
  };

  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (customerName.trim().length < 2) {
      newErrors.customerName = "Имя должно содержать не менее 2 символов";
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      newErrors.phone = "Введите корректный номер телефона (11 цифр)";
    }
    if (!occasion) {
      newErrors.occasion = "Выберите повод для букета";
    }
    if (!budget) {
      newErrors.budget = "Выберите планируемый бюджет";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/orders/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName,
          phone,
          occasion,
          budget,
          colors: selectedColors,
          wishes,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка отправки заявки");
      }

      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setErrors({ global: "Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD] font-sans">
      {/* Minimal Header */}
      <header className="h-20 bg-[#FDFDFD] border-b border-[#E8F0EA] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded-xl bg-[#1E3F20] flex items-center justify-center text-[#D4AF37] shadow-sm">
            <Flower2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-black tracking-wider text-[#1E3F20] uppercase">
            Планета цветов
          </span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-[#1E3F20] hover:text-[#0D1F0E] bg-[#E8F0EA]/45 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Вернуться в магазин</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center py-12 px-6 bg-gradient-to-b from-[#E8F0EA]/20 to-[#FDFDFD]">
        {isSuccess ? (
          <div className="w-full max-w-xl bg-[#FDFDFD] border border-[#E8F0EA] rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="w-20 h-20 bg-[#E8F0EA]/70 text-[#1E3F20] rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-[#E8F0EA] animate-bounce">
              <CheckCircle2 className="w-10 h-10 stroke-[2]" />
            </div>
            <h1 className="text-3xl font-black text-[#1E3F20] tracking-tight">
              Заявка успешно отправлена!
            </h1>
            <p className="text-sm text-[#2D2D2D]/75 leading-relaxed max-w-md mx-auto">
              Наши профессиональные флористы уже изучают ваши пожелания. Мы свяжемся с вами по номеру <strong className="text-[#1E3F20]">{phone}</strong> в течение 10 минут, чтобы согласовать детали букета.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>На главную</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-[#FDFDFD] border border-[#E8F0EA] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 animate-scale-up text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E3F20]/10 text-[#1E3F20] text-xs font-semibold tracking-wider uppercase rounded-full select-none">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Индивидуальный заказ</span>
              </div>
              <h1 className="text-3xl font-black text-[#1E3F20] tracking-tight">
                Создайте свой идеальный букет
              </h1>
              <p className="text-xs sm:text-sm text-[#2D2D2D]/60 leading-relaxed">
                Поделитесь с нами вашим видением, и флористы студии «Планета цветов» соберут уникальную цветочную композицию под ваши пожелания и бюджет.
              </p>
            </div>

            {errors.global && (
              <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100">
                {errors.global}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Occasion & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="occasion" className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider">
                    Какой повод? *
                  </label>
                  <select
                    id="occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 bg-[#E8F0EA]/15 border border-[#E8F0EA] rounded-xl text-sm font-bold text-[#2D2D2D]/85 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all cursor-pointer",
                      errors.occasion && "border-red-400 bg-red-50/10"
                    )}
                  >
                    <option value="" disabled>Выберите повод...</option>
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                  {errors.occasion && (
                    <span className="text-[10px] font-bold text-red-500 block">{errors.occasion}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="budget" className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider">
                    Планируемый бюджет *
                  </label>
                  <select
                    id="budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 bg-[#E8F0EA]/15 border border-[#E8F0EA] rounded-xl text-sm font-bold text-[#2D2D2D]/85 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all cursor-pointer",
                      errors.budget && "border-red-400 bg-red-50/10"
                    )}
                  >
                    <option value="" disabled>Выберите диапазон...</option>
                    {BUDGET_RANGES.map((bud) => (
                      <option key={bud} value={bud}>{bud}</option>
                    ))}
                  </select>
                  {errors.budget && (
                    <span className="text-[10px] font-bold text-red-500 block">{errors.budget}</span>
                  )}
                </div>
              </div>

              {/* Step 2: Preferred Colors */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider block">
                  Желаемая цветовая гамма букета
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_SWATCHES.map((swatch) => {
                    const isSelected = selectedColors.includes(swatch.name);
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => toggleColor(swatch.name)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 border rounded-xl hover:border-[#1E3F20]/30 hover:bg-[#E8F0EA]/20 transition-all cursor-pointer select-none text-xs font-bold",
                          isSelected
                            ? "border-[#1E3F20] bg-[#E8F0EA]/45 text-[#1E3F20]"
                            : "border-[#E8F0EA] bg-[#FDFDFD] text-[#2D2D2D]/70"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border border-black/10 shrink-0",
                            swatch.border && "border-[#2D2D2D]/20"
                          )}
                          style={{
                            background: swatch.hex || swatch.gradient,
                          }}
                        />
                        <span>{swatch.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Wishes / Details */}
              <div className="space-y-2">
                <label htmlFor="wishes" className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider">
                  Пожелания к букету (состав, упаковка, оформление)
                </label>
                <textarea
                  id="wishes"
                  rows={4}
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                  placeholder="Например: хочу нежные пионовидные розы и ароматный эвкалипт. Бумага должна быть матовой, бежевого цвета..."
                  className="w-full px-4 py-3 bg-[#E8F0EA]/15 border border-[#E8F0EA] rounded-xl text-sm leading-normal text-[#2D2D2D]/85 placeholder-[#2D2D2D]/35 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all resize-none"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-[#E8F0EA] my-6" />

              {/* Step 4: Contact details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider">
                    Ваше имя *
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Александра"
                    className={cn(
                      "w-full px-4 py-3 bg-[#E8F0EA]/15 border border-[#E8F0EA] rounded-xl text-sm font-bold text-[#2D2D2D]/85 placeholder-[#2D2D2D]/30 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all",
                      errors.customerName && "border-red-400 bg-red-50/10"
                    )}
                  />
                  {errors.customerName && (
                    <span className="text-[10px] font-bold text-red-500 block">{errors.customerName}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-black uppercase text-[#1E3F20]/75 tracking-wider">
                    Номер телефона *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (999) 000-00-00"
                    className={cn(
                      "w-full px-4 py-3 bg-[#E8F0EA]/15 border border-[#E8F0EA] rounded-xl text-sm font-bold text-[#2D2D2D]/85 placeholder-[#2D2D2D]/30 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all",
                      errors.phone && "border-red-400 bg-red-50/10"
                    )}
                  />
                  {errors.phone && (
                    <span className="text-[10px] font-bold text-red-500 block">{errors.phone}</span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 select-none">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md shadow-[#1E3F20]/15 active:scale-[0.98] transition-all cursor-pointer disabled:bg-[#2D2D2D]/20 disabled:text-[#2D2D2D]/40 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? "Отправка..." : "Отправить заявку флористу"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[#E8F0EA] text-center text-xs text-[#2D2D2D]/40 select-none">
        © {new Date().getFullYear()} Планета цветов. С любовью к вашим чувствам. <Heart className="w-3 h-3 inline text-red-500 fill-current ml-0.5" />
      </footer>
    </div>
  );
}
