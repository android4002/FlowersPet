"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ShieldCheck,
  Flower2,
  Phone,
  Instagram,
  MapPin,
  Search,
  X
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetailsModal } from "@/components/product/ProductDetailsModal";
import { CartSheet } from "@/components/cart/CartSheet";
import { FavoritesSheet } from "@/components/favorites/FavoritesSheet";
import { useCart, Product } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { CustomOrderSection } from "@/components/custom/CustomOrderSection";

const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Букет "Нежность Иваново"',
    description: "Изысканный авторский букет из нежных роз и альстромерий в стильной дизайнерской упаковке.",
    price: 3500.00,
    discountPrice: 3200.00,
    imageUrl: "/images/products/p1.webp",
    images: ["/images/products/p1.webp", "/images/products/p1_2.webp", "/images/products/p1_3.webp"],
    rating: 4.9,
    reviewsCount: 28,
    details: {
      "Количество": "25 цветков",
      "Состав": "Нежные розы, альстромерии, эвкалипт",
      "Высота": "55 см",
      "Упаковка": "Стильная дизайнерская бумага",
      "Стойкость": "до 12 дней"
    },
    stock: 15
  },
  {
    id: 2,
    name: "Монстера Делициоза",
    description: "Популярное комнатное растение с резными крупными листьями, неприхотливое в уходе.",
    price: 2400.00,
    discountPrice: null,
    imageUrl: "/images/products/p2.webp",
    images: ["/images/products/p2.webp", "/images/products/p2_2.webp"],
    rating: 4.7,
    reviewsCount: 14,
    details: {
      "Высота": "70 см",
      "Диаметр горшка": "19 см",
      "Освещение": "Яркий рассеянный свет / Полутень",
      "Полив": "Умеренный (после подсыхания верхнего слоя)",
      "Сложность": "Простая (неприхотлива)"
    },
    stock: 8
  },
  {
    id: 3,
    name: "Фикус Бенджамина",
    description: "Элегантное вечнозеленое деревце с пышной кроной для озеленения дома и офиса.",
    price: 1800.00,
    discountPrice: 1600.00,
    imageUrl: "/images/products/p3.webp",
    images: ["/images/products/p3.webp", "/images/products/p3_2.webp"],
    rating: 4.8,
    reviewsCount: 19,
    details: {
      "Высота": "60 см",
      "Диаметр горшка": "17 см",
      "Освещение": "Светолюбивое (избегать прямых лучей)",
      "Полив": "Регулярный (2 раза в неделю)",
      "Польза": "Отличная очистка воздуха"
    },
    stock: 12
  },
  {
    id: 4,
    name: "Гортензия садовая",
    description: "Прекрасный саженец пышноцветущей садовой гортензии для создания яркого ландшафта.",
    price: 1200.00,
    discountPrice: null,
    imageUrl: "/images/products/p4.webp",
    images: ["/images/products/p4.webp", "/images/products/p4_2.webp"],
    rating: 4.6,
    reviewsCount: 11,
    details: {
      "Высота саженца": "35-45 см",
      "Период цветения": "Июль - Октябрь",
      "Морозостойкость": "до -25°C (требует укрытия)",
      "Почва": "Кислая, влажная, дренированная",
      "Тип": "В контейнере (ЗКС)"
    },
    stock: 25
  },
  {
    id: 5,
    name: "Роза Эквадор",
    description: "Роскошные длинные розы премиум-сорта из Эквадора с крупными бутонами.",
    price: 4500.00,
    discountPrice: 4200.00,
    imageUrl: "/images/products/p5.webp",
    images: ["/images/products/p5.webp", "/images/products/p5_2.webp", "/images/products/p5_3.webp"],
    rating: 5.0,
    reviewsCount: 42,
    details: {
      "Длина стебля": "70 см",
      "Количество": "15 роз",
      "Сорт": "Freedom (Эквадор)",
      "Упаковка": "Элегантная матовая бумага с лентой",
      "Аромат": "Классический цветочный"
    },
    stock: 30
  },
  {
    id: 6,
    name: "Букет Ассорти из пионов",
    description: "Восхитительное сочетание нежно-розовых и белых пионов с изящной зеленью в дизайнерской обертке.",
    price: 4000.00,
    discountPrice: null,
    imageUrl: "/images/products/p6.png",
    images: ["/images/products/p6.png"],
    rating: 4.9,
    reviewsCount: 16,
    details: {
      "Состав": "Разноцветные пионы, эвкалипт, стильное оформление",
      "Количество": "11 пышных бутонов",
      "Высота": "50 см",
      "Повод": "Для самых любимых и важных моментов"
    },
    stock: 10
  },
  {
    id: 7,
    name: "Кактус Эхиноцереус",
    description: "Цветущий комнатный суккулент с невероятными яркими цветками и красивыми золотистыми иголками.",
    price: 900.00,
    discountPrice: null,
    imageUrl: "/images/products/p7.png",
    images: ["/images/products/p7.png"],
    rating: 4.8,
    reviewsCount: 8,
    details: {
      "Высота": "15 см",
      "Диаметр горшка": "9 см",
      "Полив": "Редкий (по мере полного высыхания грунта)",
      "Освещение": "Яркий прямой солнечный свет",
      "Цветение": "Регулярное весеннее"
    },
    stock: 15
  },
  {
    id: 8,
    name: "Орхидея Фаленопсис",
    description: "Белоснежная королевская орхидея с изящными крупными цветками для создания атмосферы уюта.",
    price: 2100.00,
    discountPrice: 1900.00,
    imageUrl: "/images/products/p8.png",
    images: ["/images/products/p8.png"],
    rating: 4.7,
    reviewsCount: 22,
    details: {
      "Высота": "65 см",
      "Диаметр горшка": "12 см",
      "Освещение": "Рассеянный свет без прямых лучей",
      "Полив": "Погружением корней раз в 7-10 дней",
      "Продолжительность цветения": "до 3 месяцев"
    },
    stock: 12
  }
];

// Map helper to categories
const getProductCategory = (product: Product): string => {
  const catId = (product as any).category_id;
  if (catId === 1) return "Букеты";
  if (catId === 2) return "Комнатные растения";
  if (catId === 3) return "Саженцы";
  
  const name = product.name.toLowerCase();
  if (name.includes("букет") || name.includes("роза эквадор") || name.includes("пионов")) return "Букеты";
  if (name.includes("делициоза") || name.includes("фикус") || name.includes("орхидея") || name.includes("кактус")) return "Комнатные растения";
  return "Саженцы";
};

export default function Home() {
  const { addItem, cartItemCount } = useCart();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dynamic products states
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [siteSettings, setSiteSettings] = useState({
    hero_title: "Цветы, созданные дарить счастье",
    hero_subtitle: "Авторские букеты и редкие комнатные растения премиум-класса с заботливой доставкой за 60 минут. Создаем цветочные шедевры с душой.",
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
    about_text: "Мы — команда профессиональных флористов из города Иваново, влюбленных в свое дело. Уже более 8 лет мы создаем авторские букеты премиум-класса и озеленяем интерьеры редкими комнатными растениями.\n\nНаш главный приоритет — безупречная свежесть каждого цветка и индивидуальный подход к каждому клиенту. Мы работаем напрямую с проверенными плантациями, чтобы радовать вас совершенной красотой природы.",
    about_years: "8+ лет опыта",
    about_years_text: "Собрано более 50 000 индивидуальных букетов и подарено миллионы улыбок.",
    footer_description: "Цветочный гипермаркет в Иванове. Делаем счастливее ваших близких каждый день с 2018 года.",
    footer_phone: "+7 (4932) 99-99-99",
    footer_instagram: "@planeta_cvetov_ivanovo",
    footer_address: "г. Иваново, пер. Пограничный, 80",
  });

  // Load from localStorage post-mount to prevent SSR hydration mismatches
  useEffect(() => {
    const savedFavorites = localStorage.getItem("flowerspet-favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites from localStorage", e);
      }
    }
  }, []);

  // Fetch dynamic site text settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/v1/analytics/settings");
        if (response.ok) {
          const data = await response.json();
          setSiteSettings(data);
        }
      } catch (err) {
        console.error("Failed to fetch site settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Fetch active products from the FastAPI backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/v1/products/");
        if (!response.ok) {
          throw new Error("Не удалось загрузить каталог товаров.");
        }
        const data = await response.json();
        const mapped = data.map((p: any) => {
          const mainImage = p.images && p.images.length > 0 ? p.images[0] : (p.image_url || "").replace(".jpg", ".webp");
          const webpImages = p.images && p.images.length > 0 
            ? p.images.map((img: string) => img.replace(".jpg", ".webp"))
            : [mainImage];
          return {
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: parseFloat(p.price),
            discountPrice: p.discount_price ? parseFloat(p.discount_price) : null,
            imageUrl: mainImage,
            stock: p.stock,
            rating: p.rating ? parseFloat(p.rating) : 4.8,
            reviewsCount: p.reviews_count || 10,
            images: webpImages,
            details: p.details || {},
            category_id: p.category_id,
            sort_order: p.sort_order
          };
        });
        setProducts(mapped);
      } catch (err: any) {
        console.error("Failed to fetch products from backend:", err);
        setError("Ошибка при получении свежих товаров. Показаны товары по умолчанию.");
        // Fallback to static seed data if backend fails
        setProducts(SEED_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFavoriteToggle = (id: number) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem("flowerspet-favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const getActivePrice = (product: Product): number => {
    if (product.discountPrice && product.discountPrice < product.price) {
      return product.discountPrice;
    }
    return product.price;
  };

  const filteredProducts = selectedCategory === "Все" 
    ? products 
    : selectedCategory === "Избранное"
      ? products.filter(p => favorites.includes(p.id))
      : products.filter(p => getProductCategory(p) === selectedCategory);

  const searchedProducts = searchQuery.trim() === ""
    ? filteredProducts
    : filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    if (sortBy === "price-asc") {
      return getActivePrice(a) - getActivePrice(b);
    }
    if (sortBy === "price-desc") {
      return getActivePrice(b) - getActivePrice(a);
    }
    if (sortBy === "discount") {
      const discountA = a.discountPrice ? a.price - a.discountPrice : 0;
      const discountB = b.discountPrice ? b.price - b.discountPrice : 0;
      return discountB - discountA;
    }
      return (a.sort_order || 0) - (b.sort_order || 0); // popular (keep default seeding order)
    });

  const categories = ["Все", "Букеты", "Комнатные растения", "Саженцы"];
  
  const featuredProduct = products.length > 0 ? products[0] : SEED_PRODUCTS[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFDFD]">
      {/* Global Interactive Header */}
      <Header 
        cartItemCount={cartItemCount} 
        onCartClick={() => setIsCartOpen(true)} 
        favoriteItemCount={favorites.length}
        onFavoriteClick={() => setIsFavoritesOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        onProductSelect={setSelectedProduct}
      />

      {/* Sliding Sidebar Cart Sheet */}
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Sliding Sidebar Favorites Sheet */}
      <FavoritesSheet 
        isOpen={isFavoritesOpen} 
        onClose={() => setIsFavoritesOpen(false)} 
        favorites={favorites} 
        onFavoriteToggle={handleFavoriteToggle} 
        products={products} 
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#E8F0EA]/40 to-[#FDFDFD] py-16 lg:py-24 overflow-hidden border-b border-[#E8F0EA]/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0C3322]/10 text-[#0C3322] text-xs font-semibold tracking-wider uppercase rounded-full select-none">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Эксклюзивная флористика в Иванове</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0C3322] leading-tight">
              {siteSettings.hero_title}
            </h1>
            
            <p className="text-[#2D2D2D]/70 text-base sm:text-lg leading-relaxed">
              {siteSettings.hero_subtitle}
            </p>

            {/* Relocated Rating Block under Subtitle */}
            <div className="flex items-center gap-1.5 select-none text-xs font-bold bg-[#E8F0EA]/40 border border-[#E8F0EA] px-3.5 py-2.5 rounded-2xl w-fit">
              <span className="text-[#FFD700] text-sm">★</span>
              <span className="text-[#0C3322] font-black">4.9</span>
              <span className="text-[#2D2D2D]/60">(120+ отзывов)</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a 
                href="#catalog" 
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0C3322] hover:bg-[#051A11] text-[#FDFDFD] font-bold rounded-xl shadow-md shadow-[#0C3322]/10 hover:shadow-lg hover:shadow-[#0C3322]/20 active:scale-95 transition-all group"
              >
                <span>{siteSettings.hero_btn_primary}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#custom-order" 
                className="flex items-center justify-center px-6 py-3.5 bg-[#D2B48C] hover:bg-[#c2a47c] text-[#0C3322] font-black rounded-xl transition-all shadow-sm active:scale-95 text-sm"
              >
                {siteSettings.hero_btn_secondary}
              </a>
            </div>
          </div>

          {/* Premium Atmospheric Image (Cleaned V2.0 - No Floating Badges) */}
          <div className="relative flex justify-center items-center w-full lg:h-[480px] group select-none">
            {/* Soft decorative glow background */}
            <div className="absolute -inset-4 bg-gradient-radial from-[#0C3322]/10 to-transparent blur-3xl rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Main Image Container */}
            <div 
              className="relative w-full max-w-[440px] h-[340px] sm:h-[400px] rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/80 transition-all duration-500 hover:scale-[1.01] hover:shadow-emerald-950/15 will-change-transform transform-gpu"
              style={{ transform: "translate3d(0, 0, 0)", isolation: "isolate" }}
            >
              <img 
                src="/images/florist_studio_hero.png" 
                alt="Процесс сборки букета флористом" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 will-change-transform transform-gpu"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section id="delivery" className="border-b border-[#E8F0EA]/55 bg-[#FDFDFD] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E8F0EA]/45 text-[#1E3F20] rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-[#E8F0EA]">
              <Clock className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1E3F20] text-sm">{siteSettings.trust_1_title}</h4>
              <p className="text-xs text-[#2D2D2D]/60">{siteSettings.trust_1_text}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E8F0EA]/45 text-[#1E3F20] rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-[#E8F0EA]">
              <Flower2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1E3F20] text-sm">{siteSettings.trust_2_title}</h4>
              <p className="text-xs text-[#2D2D2D]/60">{siteSettings.trust_2_text}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E8F0EA]/45 text-[#1E3F20] rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-[#E8F0EA]">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1E3F20] text-sm">{siteSettings.trust_3_title}</h4>
              <p className="text-xs text-[#2D2D2D]/60">{siteSettings.trust_3_text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="py-20 bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black text-[#1E3F20] mb-2 tracking-tight">
                {siteSettings.catalog_title}
              </h2>
              <p className="text-xs sm:text-sm text-[#2D2D2D]/60 max-w-lg">
                {siteSettings.catalog_subtitle}
              </p>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-xl border border-[#E8F0EA] bg-[#FDFDFD] text-[#2D2D2D]/70 hover:border-[#1E3F20]/30 hover:text-[#1E3F20] transition-all cursor-pointer",
                      selectedCategory === cat && "bg-[#1E3F20] border-[#1E3F20] text-[#FDFDFD] hover:bg-[#1E3F20] hover:text-[#FDFDFD] hover:border-[#1E3F20]"
                    )}
                    type="button"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sorting Select Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#2D2D2D]/55 uppercase tracking-wider select-none">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-[#FDFDFD] border border-[#E8F0EA] rounded-xl text-[#2D2D2D]/70 focus:outline-none focus:ring-2 focus:ring-[#1E3F20]/20 focus:border-[#1E3F20]/30 transition-all cursor-pointer"
                  aria-label="Сортировка товаров"
                >
                  <option value="popular">Популярные</option>
                  <option value="price-asc">Сначала дешевле</option>
                  <option value="price-desc">Сначала дороже</option>
                  <option value="discount">По размеру скидки</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  discountPrice={product.discountPrice}
                  imageUrl={product.imageUrl}
                  stock={product.stock}
                  rating={product.rating}
                  reviewsCount={product.reviewsCount}
                  onAddToCart={() => addItem(product)}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={favorites.includes(product.id)}
                  onClick={() => setSelectedProduct(product)}
                />
              ))
            ) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#E8F0EA]/45 text-[#1E3F20]/45 rounded-2xl flex items-center justify-center border border-[#E8F0EA]">
                  <Search className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1E3F20] text-lg">Ничего не найдено</h3>
                  <p className="text-xs text-[#2D2D2D]/60 mt-1 max-w-xs">
                    Попробуйте изменить формулировку запроса или сбросить фильтры
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 text-xs font-bold bg-[#E8F0EA]/45 hover:bg-[#E8F0EA] text-[#1E3F20] rounded-xl transition-all active:scale-95"
                >
                  Сбросить поиск
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Custom Order Section */}
      <CustomOrderSection />

      {/* About Section */}
      <section id="about" className="py-20 bg-[#E8F0EA]/20 border-t border-[#E8F0EA]/45">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <h2 className="text-3xl font-black text-[#1E3F20] tracking-tight">{siteSettings.about_title}</h2>
            <div className="text-sm text-[#2D2D2D]/70 leading-relaxed font-medium whitespace-pre-line">
              {siteSettings.about_text}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E8F0EA] bg-[#FDFDFD] p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[#1E3F20]/10 text-[#1E3F20] rounded-2xl flex items-center justify-center">
              <Flower2 className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <span className="text-2xl font-black text-[#1E3F20]">{siteSettings.about_years}</span>
            <p className="text-xs text-[#2D2D2D]/60 max-w-xs">
              {siteSettings.about_years_text}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="bg-[#0C3322] text-[#FFFFFF] py-16 border-t border-[#1E3F20]/45 selection:bg-[#FFD700] selection:text-[#0C3322]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] flex items-center justify-center text-[#0C3322] shadow-md">
                <Flower2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-wider text-[#FFFFFF] uppercase">
                Планета цветов
              </span>
            </div>
            <p className="text-sm text-[#FFFFFF]/85 leading-relaxed max-w-[240px] font-medium">
              {siteSettings.footer_description}
            </p>
          </div>
          
          <div>
            <h5 className="font-black text-[#FFD700] mb-5 text-sm uppercase tracking-wider">Магазин</h5>
            <ul className="space-y-3.5 text-sm text-[#FFFFFF]/90 font-semibold">
              <li><a href="#catalog" className="hover:text-[#FFD700] transition-colors">Свежие букеты</a></li>
              <li><a href="#catalog" className="hover:text-[#FFD700] transition-colors">Комнатные цветы</a></li>
              <li><a href="#catalog" className="hover:text-[#FFD700] transition-colors">Саженцы роз</a></li>
              <li><a href="#custom-order" className="hover:text-[#FFD700] transition-colors">Индивидуальный заказ</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-black text-[#FFD700] mb-5 text-sm uppercase tracking-wider">Информация</h5>
            <ul className="space-y-3.5 text-sm text-[#FFFFFF]/90 font-semibold">
              <li><a href="#delivery" className="hover:text-[#FFD700] transition-colors">Доставка курьером</a></li>
              <li><a href="#delivery" className="hover:text-[#FFD700] transition-colors">Способы оплаты</a></li>
              <li><a href="#delivery" className="hover:text-[#FFD700] transition-colors">Гарантия свежести</a></li>
              <li><a href="#about" className="hover:text-[#FFD700] transition-colors">О компании</a></li>
            </ul>
          </div>
          
          <div className="space-y-5">
            <h5 className="font-black text-[#FFD700] text-sm uppercase tracking-wider">Контакты</h5>
            <div className="flex items-center gap-3 text-sm text-[#FFFFFF] font-extrabold bg-[#FFFFFF]/5 p-2 rounded-xl border border-[#FFFFFF]/10 hover:border-[#FFD700]/30 transition-all">
              <Phone className="w-4.5 h-4.5 text-[#FFD700] shrink-0" />
              <a href={`tel:${(siteSettings.footer_phone ?? "").replace(/\s|\(|\)|-/g, "")}`} className="hover:text-[#FFD700] transition-colors">{siteSettings.footer_phone}</a>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#FFFFFF] font-extrabold bg-[#FFFFFF]/5 p-2 rounded-xl border border-[#FFFFFF]/10 hover:border-[#FFD700]/30 transition-all">
              <Instagram className="w-4.5 h-4.5 text-[#FFD700] shrink-0" />
              <a href={`https://instagram.com/${(siteSettings.footer_instagram ?? "").replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#FFD700] transition-colors">{siteSettings.footer_instagram}</a>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#FFFFFF] font-extrabold bg-[#FFFFFF]/5 p-2.5 rounded-xl border border-[#FFFFFF]/10 hover:border-[#FFD700]/30 transition-all">
              <MapPin className="w-4.5 h-4.5 text-[#FFD700] shrink-0 mt-0.5" />
              <span className="leading-snug">{siteSettings.footer_address}</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-[#FFFFFF]/15 text-center text-xs text-[#FFFFFF]/70 font-semibold">
          © {new Date().getFullYear()} Планета цветов. Все права защищены.
        </div>
      </footer>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => addItem(selectedProduct)}
          onFavoriteToggle={() => handleFavoriteToggle(selectedProduct.id)}
          isFavorite={favorites.includes(selectedProduct.id)}
        />
      )}
    </div>
  );
}
