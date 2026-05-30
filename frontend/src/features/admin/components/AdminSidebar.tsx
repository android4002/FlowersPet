"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Flower, 
  Moon, 
  Sun,
  UserCircle
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export function AdminSidebar({ theme, toggleTheme }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { id: "dashboard", label: "Панель управления", icon: LayoutDashboard, path: "/admin" },
    { id: "products", label: "Товары / Каталог", icon: ShoppingBag, path: "/admin/inventory" },
    { id: "orders", label: "Заказы", icon: Receipt, path: "/admin/orders" },
    { id: "customers", label: "Сотрудники", icon: Users, path: "/admin/staff" },
    { id: "settings", label: "Настройки сайта", icon: Settings, path: "/admin/settings" },
    { id: "profile", label: "Личный кабинет", icon: UserCircle, path: "/admin/profile" },
  ];

  return (
    <div 
      className={`relative h-screen bg-slate-900 text-slate-100 flex flex-col justify-between transition-all duration-300 border-r border-slate-800 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-md"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Header / Brand */}
      <div className="flex flex-col">
        <div className={`flex items-center gap-3 px-6 py-6 border-b border-slate-800/80 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5A880] text-white shadow-lg animate-pulse-slow">
            <Flower className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#E8D8C8]">
                ПЛАНЕТА ЦВЕТОВ
              </span>
              <span className="text-[9px] font-bold text-[#D4AF37]/80 tracking-widest uppercase">
                ADMIN SHELL v2.0
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 px-3 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path && (item.id !== "dashboard" || pathname === "/admin");
            const isActualActive = item.id === "dashboard" ? pathname === "/admin" : pathname === item.path;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`flex items-center gap-4 w-full p-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActualActive 
                    ? "bg-[#C5A880] text-white shadow-md shadow-[#C5A880]/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActualActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme & User */}
      <div className="flex flex-col gap-4 p-4 border-t border-slate-800/80 bg-slate-950/20">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-4 w-full p-2.5 rounded-lg text-xs font-semibold transition-all border border-slate-800 bg-slate-800/20 hover:bg-slate-800/60 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4.5 w-4.5 text-[#C5A880]" />
              {!collapsed && <span>Темная тема</span>}
            </>
          ) : (
            <>
              <Sun className="h-4.5 w-4.5 text-amber-400" />
              {!collapsed && <span>Светлая тема</span>}
            </>
          )}
        </button>

        {/* User Card */}
        <Link href="/admin/profile" className={`flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-800/50 transition-all ${collapsed ? "justify-center" : ""}`}>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5A880]/10 border border-[#C5A880]/20 text-xs font-bold text-[#C5A880]">
            АД
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">Анатолий Данилов</span>
              <span className="text-[9px] font-semibold text-slate-500 truncate">Старший администратор</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
