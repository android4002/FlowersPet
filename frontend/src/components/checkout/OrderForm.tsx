"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Phone, User, Mail, MapPin, Sparkles, AlertCircle } from "lucide-react";
import { Price } from "../shared/Price";
import { cn } from "@/lib/utils";

// 1. Zod Validation Schema with strict regular expression for Russian phone numbers
const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: "Имя должно содержать не менее 2 символов" })
    .max(255, { message: "Слишком длинное имя" }),
  phone: z
    .string()
    .regex(/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/, {
      message: "Введите телефон строго в формате +7 (9XX) XXX-XX-XX",
    }),
  email: z
    .string()
    .email({ message: "Некорректный адрес электронной почты" })
    .or(z.literal("")), // Allows optional email
  address: z
    .string()
    .min(5, { message: "Введите подробный адрес доставки (не менее 5 символов)" }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface OrderFormProps {
  onSuccessClose?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSuccessClose }) => {
  const router = useRouter();
  const { items, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  // Automatically applies the +7 (9XX) XXX-XX-XX mask as the user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ""); // Strip non-numeric chars
    
    // Force prefix +7 or 8 to map to +7
    if (input.startsWith("7") || input.startsWith("8")) {
      input = input.substring(1);
    }
    
    // Truncate to maximum Russian phone length (10 digits after +7)
    input = input.substring(0, 10);
    
    // Apply visual masking structure
    let formatted = "+7";
    if (input.length > 0) {
      formatted += " (" + input.substring(0, 3);
    }
    if (input.length >= 4) {
      formatted += ") " + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formatted += "-" + input.substring(6, 8);
    }
    if (input.length >= 9) {
      formatted += "-" + input.substring(8, 10);
    }

    setValue("phone", input.length === 0 ? "" : formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      setSubmitError("Ваша корзина пуста. Нечего оформлять!");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Format payload to match backend schema expectations (camelCase to snake_case mapping)
    const orderPayload = {
      customer_name: data.customerName,
      phone: data.phone,
      email: data.email === "" ? null : data.email,
      address: data.address,
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
       // Connect to the actual backend API using fetch
      const response = await fetch("/api/v1/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Произошла ошибка при обработке заказа.");
      }

      // Success flow
      clearCart();
      if (onSuccessClose) {
        onSuccessClose();
      }
      
      // Navigate to the thanks page
      router.push("/thanks");
      
    } catch (err: any) {
      console.error("Checkout Submission Error:", err);
      setSubmitError(err.message || "Ошибка подключения. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-5 text-left font-sans"
      aria-label="Форма оформления заказа"
    >
      {/* Error Alert Box */}
      {submitError && (
        <div 
          className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Customer Name Input */}
      <div className="space-y-1">
        <label 
          htmlFor="customerName" 
          className="text-xs font-bold text-[#1E3F20]/75 uppercase tracking-wider block"
        >
          ФИО получателя *
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
          <input
            id="customerName"
            type="text"
            placeholder="Иван Иванов"
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-[#FDFDFD] border border-[#E8F0EA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all",
              errors.customerName && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500"
            )}
            {...register("customerName")}
            aria-invalid={!!errors.customerName}
            aria-describedby={errors.customerName ? "customerName-error" : undefined}
          />
        </div>
        {errors.customerName && (
          <p id="customerName-error" className="text-[10px] font-bold text-red-500">
            {errors.customerName.message}
          </p>
        )}
      </div>

      {/* Phone Number Input */}
      <div className="space-y-1">
        <label 
          htmlFor="phone" 
          className="text-xs font-bold text-[#1E3F20]/75 uppercase tracking-wider block"
        >
          Номер телефона *
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
          <input
            id="phone"
            type="tel"
            placeholder="+7 (999) 999-99-99"
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-[#FDFDFD] border border-[#E8F0EA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all",
              errors.phone && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500"
            )}
            {...register("phone")}
            onChange={handlePhoneChange}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
        </div>
        {errors.phone && (
          <p id="phone-error" className="text-[10px] font-bold text-red-500">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Email Address Input (Optional) */}
      <div className="space-y-1">
        <label 
          htmlFor="email" 
          className="text-xs font-bold text-[#1E3F20]/75 uppercase tracking-wider block"
        >
          Электронная почта (Необязательно)
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2D2D]/40" />
          <input
            id="email"
            type="email"
            placeholder="example@mail.ru"
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-[#FDFDFD] border border-[#E8F0EA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all",
              errors.email && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500"
            )}
            {...register("email")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-[10px] font-bold text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Delivery Address Input */}
      <div className="space-y-1">
        <label 
          htmlFor="address" 
          className="text-xs font-bold text-[#1E3F20]/75 uppercase tracking-wider block"
        >
          Адрес доставки *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#2D2D2D]/40" />
          <textarea
            id="address"
            rows={3}
            placeholder="г. Иваново, ул. Ленина, д. 10, кв. 25"
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-[#FDFDFD] border border-[#E8F0EA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all resize-none",
              errors.address && "border-red-500/50 focus:ring-red-500/10 focus:border-red-500"
            )}
            {...register("address")}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
        </div>
        {errors.address && (
          <p id="address-error" className="text-[10px] font-bold text-red-500">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Cart Summary Section */}
      <div className="p-4 border border-[#E8F0EA] bg-[#E8F0EA]/15 rounded-xl flex items-baseline justify-between select-none">
        <span className="text-[11px] font-black uppercase text-[#1E3F20]/70 tracking-wider">
          Всего к оплате
        </span>
        <Price price={cartTotal} className="text-lg" />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-4 bg-[#1E3F20] hover:bg-[#0D1F0E] text-[#FDFDFD] font-bold text-sm rounded-xl shadow-md shadow-[#1E3F20]/15 active:scale-95 transition-all group select-none cursor-pointer",
          (isSubmitting || items.length === 0) && "bg-[#2D2D2D]/20 text-[#2D2D2D]/40 cursor-not-allowed hover:bg-[#2D2D2D]/20 active:scale-100 shadow-none"
        )}
      >
        {isSubmitting ? (
          // Visual Loader / Spinner for state loading
          <div className="flex items-center gap-2">
            <svg 
              className="animate-spin h-5 w-5 text-current" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              role="img"
              aria-label="Загрузка"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Оформляем заказ...</span>
          </div>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Подтвердить заказ</span>
          </>
        )}
      </button>
    </form>
  );
};
