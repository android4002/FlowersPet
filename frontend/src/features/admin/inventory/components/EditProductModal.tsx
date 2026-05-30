"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Product } from "../types";
import { updateProductDetails, uploadProductImage } from "../actions";
import { X, Image as ImageIcon, CheckCircle, Info } from "lucide-react";

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onRefresh: () => void;
}

export function EditProductModal({ product, onClose, onRefresh }: EditProductModalProps) {
  const [imagesList, setImagesList] = useState<string[]>(product.images && product.images.length > 0 ? product.images : [product.image_url]);
  const [coverImage, setCoverImage] = useState<string>(product.image_url);
  const [newImageUrl, setNewImageUrl] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: product.name,
      category: product.category,
      price: product.base_price || product.price,
      discount_price: product.discount_price,
      stock: product.stock,
      is_active: product.is_active,
      description: product.description || "",
      image_url: product.image_url,
      images: product.images || [],
    },
  });

  const handleAddImage = () => {
    if (!newImageUrl.trim() || !newImageUrl.startsWith("http")) {
      alert("Укажите корректную ссылку на фото (начиная с http)");
      return;
    }
    const newList = [...imagesList, newImageUrl];
    setImagesList(newList);
    setValue("images", newList);
    setNewImageUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadProductImage(file);
      if (uploadedUrl) {
        const newList = [...imagesList, uploadedUrl];
        setImagesList(newList);
        setValue("images", newList);
        
        if (!coverImage) {
          setCoverImage(uploadedUrl);
          setValue("image_url", uploadedUrl);
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Не удалось загрузить изображение с устройства.");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemoveImage = (img: string) => {
    const newList = imagesList.filter((i) => i !== img);
    setImagesList(newList);
    setValue("images", newList);
    if (coverImage === img && newList.length > 0) {
      setCoverImage(newList[0]);
      setValue("image_url", newList[0]);
    }
  };

  const handleSelectCover = (img: string) => {
    setCoverImage(img);
    setValue("image_url", img);
  };

  const onSubmit = async (formData: any) => {
    try {
      const updateData = {
        name: formData.name,
        category: formData.category,
        base_price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        stock: Number(formData.stock),
        is_active: Boolean(formData.is_active),
        description: formData.description,
        image_url: coverImage,
        images: imagesList
      };

      const success = await updateProductDetails(product.id, updateData as any);
      if (success) {
        onRefresh();
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка при обновлении товара");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ✏️ Редактирование товара
            </h3>
            <p className="text-[10px] text-slate-400">
              Измените характеристики, описание и галерею фотографий букета
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Main inputs */}
            <div className="space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Название букета / товара
                </label>
                <input
                  type="text"
                  {...register("name", { required: true })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                  placeholder="Например: Букет «Французский шелк»"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Категория витрины
                </label>
                <select
                  {...register("category")}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="Букеты">💐 Букеты</option>
                  <option value="Комнатные">🪴 Комнатные растения</option>
                  <option value="Суккуленты">🌵 Суккуленты</option>
                </select>
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Цена (₽)
                  </label>
                  <input
                    type="number"
                    {...register("price", { required: true, min: 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                    placeholder="3500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Скидка (₽)
                  </label>
                  <input
                    type="number"
                    {...register("discount_price", { min: 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                    placeholder="3200 (Опционально)"
                  />
                </div>
              </div>

              {/* Stock and Active Toggle */}
              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Остаток на складе (шт.)
                  </label>
                  <input
                    type="number"
                    {...register("stock", { required: true, min: 0 })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                    placeholder="15"
                  />
                </div>

                <div className="flex flex-col pt-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                    Статус на сайте
                  </span>
                  <label className="inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      {...register("is_active")}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A880]"></div>
                    <span className="ms-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Активен
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Описание товара / Состав букета
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100 resize-none"
                  placeholder="Опишите состав букета, сорт цветов или рекомендации по уходу..."
                />
              </div>

            </div>

            {/* Right side: Gallery & Photos */}
            <div className="flex flex-col gap-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                  Галерея фотографий товара
                </span>
                <p className="text-[9px] text-slate-400 mb-3">
                  Добавьте URL картинок. Выберите обложку, нажав на звездочку ⭐ на фото.
                </p>
                
                 {/* Input to add photo */}
                <div className="flex flex-col gap-2.5 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... (ссылка)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#bfa075] text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                    >
                      Добавить
                    </button>
                  </div>
                  
                  {/* Upload photo from local device */}
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#C5A880] hover:bg-[#C5A880]/10 dark:hover:bg-[#C5A880]/5 text-[#C5A880] text-xs font-bold cursor-pointer transition-colors w-full select-none">
                    <span>📁 Загрузить фото с устройства</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* List of images */}
                <div className="grid grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {imagesList.map((img, idx) => {
                    const isCover = coverImage === img;
                    return (
                      <div key={idx} className="group relative h-20 rounded-lg border border-slate-200/60 dark:border-slate-850 overflow-hidden shadow-sm hover:border-[#C5A880] transition-colors">
                        <img src={img} className="h-full w-full object-cover" alt="Букет" />
                        
                        {/* Badges/Controls */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectCover(img)}
                            className={`p-1 rounded bg-white text-slate-800 hover:text-amber-500 shadow ${isCover ? "text-amber-500 font-bold" : ""}`}
                            title="Сделать главным изображением"
                          >
                            {isCover ? "⭐" : "☆"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img)}
                            className="p-1 rounded bg-white text-rose-600 hover:bg-rose-50 shadow"
                            title="Удалить из галереи"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Cover pill */}
                        {isCover && (
                          <span className="absolute top-1 left-1 px-1 py-0.5 text-[7px] font-extrabold bg-amber-500 text-white rounded">
                            ОБЛОЖКА
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cover preview card */}
              <div className="mt-auto p-4 bg-[#F7F3EE] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                  {coverImage ? (
                    <img src={coverImage} className="h-full w-full object-cover" alt="Превью" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-[#C5A880] uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Готов к сохранению</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                    Главное фото и изменения будут обновлены на сайте сразу
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Action Buttons footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#C5A880] hover:bg-[#bfa075] text-white text-xs font-bold rounded-lg transition-colors shadow disabled:opacity-50"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
