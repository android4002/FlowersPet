"use client";

import { useEffect, useState } from "react";
import {
  Settings, Save, RefreshCw, CheckCircle,
  Sparkles, Phone, MapPin, ShoppingBag, Info, Shield, Star
} from "lucide-react";

const TABS = [
  { id: "hero",    label: "Главный баннер",  icon: Sparkles },
  { id: "trust",   label: "Преимущества",    icon: Shield },
  { id: "catalog", label: "Каталог",         icon: ShoppingBag },
  { id: "about",   label: "О мастерской",    icon: Info },
  { id: "footer",  label: "Контакты",        icon: Phone },
];

const DEFAULTS = {
  hero_title: "Цветы, созданные дарить счастье",
  hero_subtitle: "Авторские букеты и редкие комнатные растения премиум-класса с заботливой доставкой за 60 минут.",
  hero_btn_primary: "Перейти к цветам",
  hero_btn_secondary: "Индивидуальный заказ",
  trust_1_title: "Доставка за 60 минут",
  trust_1_text: "Собственные вежливые курьеры",
  trust_2_title: "Свежесть 100%",
  trust_2_text: "Прямые поставки трижды в неделю",
  trust_3_title: "Контроль качества",
  trust_3_text: "Фото букета перед отправкой",
  catalog_title: "Наш ассортимент",
  catalog_subtitle: "Премиальные букеты, роскошные декоративно-лиственные монстеры и фикусы, а также саженцы для вашего сада.",
  about_title: "Цветочная мастерская «Планета цветов»",
  about_text: "Мы — команда профессиональных флористов из города Иваново, влюбленных в свое дело.",
  about_years: "8+ лет опыта",
  about_years_text: "Собрано более 50 000 индивидуальных букетов и подарено миллионы улыбок.",
  footer_description: "Цветочный гипермаркет в Иванове. Делаем счастливее ваших близких каждый день с 2018 года.",
  footer_phone: "+7 (4932) 99-99-99",
  footer_instagram: "@planeta_cvetov_ivanovo",
  footer_address: "г. Иваново, пер. Пограничный, 80",
};

type FormData = typeof DEFAULTS;

function Field({
  label, hint, value, onChange, multiline = false, rows = 3
}: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; rows?: number;
}) {
  const cls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] transition-all resize-none";
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} className={cls} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} className={cls} />
      }
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
        <Icon className="h-4 w-4 text-[#C5A880]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULTS);

  const set = (key: keyof FormData) => (val: string) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/analytics/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFormData({ ...DEFAULTS, ...data });
    } catch {
      setError("Не удалось загрузить настройки. Проверьте соединение с сервером.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/v1/analytics/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Ошибка сохранения настроек.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in text-slate-800 dark:text-slate-100 font-sans">

      {/* Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-900">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#C5A880]" />
            <span>Настройки сайта</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Редактируйте тексты, контакты и содержимое всех секций витрины в реальном времени
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#C5A880]/30 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Сбросить</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 text-[#C5A880] animate-spin" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Загрузка настроек...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2.5 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Настройки сохранены и применились на витрине!</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === id
                    ? "border-[#C5A880] text-[#C5A880]"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Hero */}
          {activeTab === "hero" && (
            <div className="space-y-4 max-w-3xl">
              <Card title="Главный баннер (Hero Section)" icon={Sparkles}>
                <Field label="Главный заголовок" value={formData.hero_title} onChange={set("hero_title")} />
                <Field label="Подзаголовок" value={formData.hero_subtitle} onChange={set("hero_subtitle")} multiline rows={3} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Текст кнопки «Каталог»" value={formData.hero_btn_primary} onChange={set("hero_btn_primary")} />
                  <Field label="Текст кнопки «Заказ»" value={formData.hero_btn_secondary} onChange={set("hero_btn_secondary")} />
                </div>
              </Card>
            </div>
          )}

          {/* Tab: Trust */}
          {activeTab === "trust" && (
            <div className="space-y-4 max-w-3xl">
              {[
                { n: "1", t: formData.trust_1_title, tx: formData.trust_1_text, kt: "trust_1_title" as keyof FormData, kx: "trust_1_text" as keyof FormData },
                { n: "2", t: formData.trust_2_title, tx: formData.trust_2_text, kt: "trust_2_title" as keyof FormData, kx: "trust_2_text" as keyof FormData },
                { n: "3", t: formData.trust_3_title, tx: formData.trust_3_text, kt: "trust_3_title" as keyof FormData, kx: "trust_3_text" as keyof FormData },
              ].map(({ n, t, tx, kt, kx }) => (
                <Card key={n} title={`Преимущество ${n}`} icon={Shield}>
                  <Field label="Заголовок" value={t} onChange={set(kt)} />
                  <Field label="Подпись" value={tx} onChange={set(kx)} />
                </Card>
              ))}
            </div>
          )}

          {/* Tab: Catalog */}
          {activeTab === "catalog" && (
            <div className="space-y-4 max-w-3xl">
              <Card title="Секция каталога" icon={ShoppingBag}>
                <Field label="Заголовок секции" value={formData.catalog_title} onChange={set("catalog_title")} />
                <Field label="Подзаголовок" value={formData.catalog_subtitle} onChange={set("catalog_subtitle")} multiline rows={2} />
              </Card>
            </div>
          )}

          {/* Tab: About */}
          {activeTab === "about" && (
            <div className="space-y-4 max-w-3xl">
              <Card title="О мастерской" icon={Info}>
                <Field label="Заголовок блока" value={formData.about_title} onChange={set("about_title")} />
                <Field label="Текст описания" value={formData.about_text} onChange={set("about_text")} multiline rows={6} />
              </Card>
              <Card title="Карточка достижений" icon={Star}>
                <Field label="Цифра / заголовок (напр. «8+ лет опыта»)" value={formData.about_years} onChange={set("about_years")} />
                <Field label="Подпись под цифрой" value={formData.about_years_text} onChange={set("about_years_text")} multiline rows={2} />
              </Card>
            </div>
          )}

          {/* Tab: Footer */}
          {activeTab === "footer" && (
            <div className="space-y-4 max-w-3xl">
              <Card title="Описание компании" icon={Info}>
                <Field label="Текст в подвале" value={formData.footer_description} onChange={set("footer_description")} multiline rows={3} />
              </Card>
              <Card title="Контактные данные" icon={Phone}>
                <Field label="Телефон" hint="Формат: +7 (XXXX) XX-XX-XX" value={formData.footer_phone} onChange={set("footer_phone")} />
                <Field label="Instagram / соцсеть" hint="Например: @planeta_cvetov_ivanovo" value={formData.footer_instagram} onChange={set("footer_instagram")} />
                <Field label="Адрес" value={formData.footer_address} onChange={set("footer_address")} />
              </Card>
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end pt-2 max-w-3xl">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A880] hover:bg-[#b0936b] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 font-black text-xs text-white uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              {saving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Сохранение...</span></> : <><Save className="h-3.5 w-3.5" /><span>Сохранить настройки</span></>}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
