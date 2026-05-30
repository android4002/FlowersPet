"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Shield, Bell, Key, Save, RefreshCw,
  CheckCircle, Eye, EyeOff, LogOut, Clock, Activity,
  ShoppingBag, Receipt, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = "/api/v1/admin/profile";

// ─── Mock activity log ───
const ACTIVITY = [
  { id: 1, action: "Изменён статус заказа #34 → «В доставке»", time: "21:41", type: "order" },
  { id: 2, action: "Добавлен товар «Монстера Делициоза»", time: "19:12", type: "product" },
  { id: 3, action: "Обновлены настройки сайта (Hero-секция)", time: "18:55", type: "settings" },
  { id: 4, action: "Изменён статус заказа #31 → «Выполнен»", time: "17:30", type: "order" },
  { id: 5, action: "Загружено фото товара #12", time: "16:08", type: "product" },
  { id: 6, action: "Отправлено сообщение сотруднику @manager1", time: "15:44", type: "staff" },
];

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "edit", label: "Редактировать профиль" },
  { id: "security", label: "Безопасность" },
  { id: "notifications", label: "Уведомления" },
];

function Card({ title, icon: Icon, children, className }: {
  title: string; icon: any; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4", className)}>
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <Icon className="h-4 w-4 text-[#C5A880]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", hint, disabled }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] transition-all",
          disabled && "bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
        )}
      />
    </div>
  );
}

function SaveButton({ saving, label = "Сохранить" }: { saving: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A880] hover:bg-[#b0936b] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 font-black text-xs text-white uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
    >
      {saving
        ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Сохранение...</span></>
        : <><Save className="h-3.5 w-3.5" /><span>{label}</span></>
      }
    </button>
  );
}

const activityTypeColor = (type: string) => {
  if (type === "order") return "bg-emerald-500/10 text-emerald-400";
  if (type === "product") return "bg-blue-500/10 text-blue-400";
  if (type === "settings") return "bg-amber-500/10 text-amber-400";
  return "bg-violet-500/10 text-violet-400";
};
const activityTypeLabel = (type: string) => {
  if (type === "order") return "Заказ";
  if (type === "product") return "Товар";
  if (type === "settings") return "Настройки";
  return "Персонал";
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile data from API
  const [profile, setProfile] = useState({
    full_name: "", email: "", phone: "", username: "", is_superuser: false, created_at: "",
  });

  // Edit fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Security
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Notifications (local state — no backend for this yet)
  const [notifs, setNotifs] = useState({
    new_order: true, order_status: true, low_stock: true,
    new_staff: false, daily_report: true, telegram_alerts: true,
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data);
      setName(data.full_name);
      setEmail(data.email);
      setPhone(data.phone);
    } catch {
      setError("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Ошибка сохранения");
      }
      const data = await res.json();
      setProfile(p => ({ ...p, ...data.profile }));
      showSuccess("Профиль успешно обновлён");
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (!currentPwd) return setPwdError("Введите текущий пароль");
    if (newPwd.length < 8) return setPwdError("Новый пароль должен быть не менее 8 символов");
    if (newPwd !== confirmPwd) return setPwdError("Пароли не совпадают");
    setSaving(true);
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Ошибка смены пароля");
      }
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      showSuccess("Пароль успешно изменён");
    } catch (err: any) {
      setPwdError(err.message || "Ошибка смены пароля");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "АД";

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const STATS = [
    { label: "Заказов обработано", value: "247", icon: Receipt, color: "text-emerald-400" },
    { label: "Товаров добавлено", value: "38", icon: ShoppingBag, color: "text-blue-400" },
    { label: "Дней в системе", value: profile.created_at ? String(Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)) : "—", icon: Clock, color: "text-amber-400" },
    { label: "Действий за месяц", value: "1 204", icon: Activity, color: "text-violet-400" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-[#C5A880] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-slate-800 dark:text-slate-100 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-900">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <User className="h-5 w-5 text-[#C5A880]" />
            <span>Личный кабинет</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Управление профилем, безопасностью и уведомлениями
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all hover:bg-rose-100 dark:hover:bg-rose-950/40 active:scale-95">
          <LogOut className="h-3.5 w-3.5" />
          <span>Выйти</span>
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile hero card */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-[#C5A880]/15 border-2 border-[#C5A880]/30 flex items-center justify-center text-2xl font-black text-[#C5A880]">
            {initials}
          </div>
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{profile.full_name || profile.username}</h3>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C5A880]/10 rounded-full">
            <Shield className="h-3 w-3 text-[#C5A880]" />
            <span className="text-[10px] font-bold text-[#C5A880] uppercase tracking-wider">
              {profile.is_superuser ? "Старший администратор" : "Администратор"}
            </span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone || "—"}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />В системе с {joinedDate}</span>
          </div>
        </div>
        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Последний вход</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Сегодня</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === id ? "border-[#C5A880] text-[#C5A880]" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >{label}</button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Последние действия" icon={Activity} className="lg:col-span-2">
            <div className="space-y-2">
              {ACTIVITY.map(({ id, action, time, type }) => (
                <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all">
                  <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold", activityTypeColor(type))}>
                    {activityTypeLabel(type)}
                  </span>
                  <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 font-medium">{action}</span>
                  <span className="shrink-0 text-[10px] text-slate-400 font-bold">{time}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Права доступа" icon={Shield}>
            <div className="space-y-2">
              {["Управление заказами","Управление каталогом","Управление персоналом","Настройки сайта","Просмотр аналитики","Рассылка уведомлений"].map(perm => (
                <div key={perm} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Telegram-уведомления" icon={Bell}>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Бот подключён и активен</span>
              </div>
              <p className="text-xs text-slate-400">Уведомления о новых заказах приходят в Telegram-бот магазина.</p>
              <div className="text-[10px] text-slate-400 space-y-1">
                <p><span className="font-bold text-slate-600 dark:text-slate-300">Токен бота:</span> 8803723349:AAF•••••</p>
                <p><span className="font-bold text-slate-600 dark:text-slate-300">Chat ID:</span> не настроен</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Edit profile */}
      {activeTab === "edit" && (
        <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-4">
          <Card title="Личные данные" icon={User}>
            <Field label="Полное имя" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Телефон" value={phone} onChange={setPhone} hint="Формат: +7 (XXXX) XX-XX-XX" />
          </Card>
          <Card title="Должность" icon={Shield}>
            <Field label="Роль" value={profile.is_superuser ? "Старший администратор" : "Администратор"} disabled />
            <p className="text-[10px] text-slate-400">Роль назначается системным администратором</p>
          </Card>
          <div className="flex justify-end">
            <SaveButton saving={saving} />
          </div>
        </form>
      )}

      {/* Tab: Security */}
      {activeTab === "security" && (
        <div className="max-w-2xl space-y-4">
          <form onSubmit={handleChangePassword}>
            <Card title="Смена пароля" icon={Key}>
              {pwdError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{pwdError}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <Field label="Новый пароль" value={newPwd} onChange={setNewPwd} type="password" hint="Минимум 8 символов" />
              <Field label="Подтвердите новый пароль" value={confirmPwd} onChange={setConfirmPwd} type="password" />
              <div className="flex justify-end pt-2">
                <SaveButton saving={saving} label="Сменить пароль" />
              </div>
            </Card>
          </form>

          <Card title="Активные сессии" icon={Activity}>
            <div className="space-y-2">
              {[
                { device: "MacBook Pro — Safari", location: "Иваново, RU", time: "Сейчас", current: true },
                { device: "iPhone 15 — Safari", location: "Иваново, RU", time: "2 часа назад", current: false },
              ].map(({ device, location, time, current }) => (
                <div key={device} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      {device}
                      {current && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded-full">Текущая</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">{location} · {time}</p>
                  </div>
                  {!current && (
                    <button type="button" className="text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors">Завершить</button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeTab === "notifications" && (
        <div className="max-w-2xl space-y-4">
          <Card title="Настройки уведомлений" icon={Bell}>
            <div className="space-y-3">
              {([
                { key: "new_order", label: "Новый заказ", desc: "При поступлении нового заказа" },
                { key: "order_status", label: "Смена статуса заказа", desc: "При изменении статуса любого заказа" },
                { key: "low_stock", label: "Низкий остаток товара", desc: "Когда остаток товара меньше 3 шт." },
                { key: "new_staff", label: "Новый сотрудник", desc: "При регистрации нового менеджера в боте" },
                { key: "daily_report", label: "Ежедневный отчёт", desc: "Сводка по заказам и выручке за день" },
                { key: "telegram_alerts", label: "Telegram-уведомления", desc: "Дублировать все уведомления в Telegram" },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{label}</p>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                    className={cn("relative w-10 h-5 rounded-full transition-all shrink-0", notifs[key] ? "bg-[#C5A880]" : "bg-slate-200 dark:bg-slate-700")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", notifs[key] ? "left-5" : "left-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex justify-end">
            <button
              onClick={() => showSuccess("Настройки уведомлений сохранены")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A880] hover:bg-[#b0936b] font-black text-xs text-white uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5" /><span>Сохранить</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
