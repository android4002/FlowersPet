"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductCreateSchema, ProductCreateInput } from "../schema";
import { createProduct, uploadProductImage } from "../actions";
import { X, Image as ImageIcon, CheckCircle, Info } from "lucide-react";

interface CreateProductModalProps {
  onClose: () => void;
  onRefresh: () => void;
}

export function CreateProductModal({ onClose, onRefresh }: CreateProductModalProps) {
  const [imagesList, setImagesList] = useState<string[]>([
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=400"
  ]);
  const [coverImage, setCoverImage] = useState<string>("https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400");
  const [newImageUrl, setNewImageUrl] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductCreateInput>({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues: {
      name: "",
      category: "Букеты",
      price: 0,
      discount_price: null,
      stock: 0,
      is_active: true,
      image_url: coverImage,
      images: imagesList,
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
        
        if (!coverImage || coverImage.startsWith("https://images.unsplash.com/photo-1561181286-d3fee7d55364")) {
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

  const onSubmit = async (data: ProductCreateInput) => {
    // Inject current cover image and images list
    data.image_url = coverImage;
    data.images = imagesList;

    try {
      await createProduct(data);
      onRefresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Ошибка при сохранении букета");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ➕ Создание нового товара
            </h3>
            <p className="text-[10px] text-slate-400">
              Заполните характеристики и загрузите галерею фотографий букета
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Block: Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Название букета</label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] text-slate-800 dark:text-slate-100"
                  placeholder="Введите название..."
                />
                {errors.name && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.name.message}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Категория</label>
                <select
                  {...register("category")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-[#C5A880] focus:border-[#C5A880] text-slate-800 dark:text-slate-100"
                >
                  <option value="Букеты">Букеты</option>
                  <option value="Комнатные">Комнатные</option>
                  <option value="Суккуленты">Суккуленты</option>
                </select>
                {errors.category && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.category.message}</p>}
              </div>

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Цена (₽)</label>
                  <input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                    placeholder="Цена..."
                  />
                  {errors.price && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Скидка (₽)</label>
                  <input
                    type="number"
                    {...register("discount_price", { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                    placeholder="Скидка..."
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Количество на складе</label>
                <input
                  type="number"
                  {...register("stock", { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                  placeholder="Остаток на складе..."
                />
                {errors.stock && <p className="text-[9px] text-rose-500 font-bold mt-1">{errors.stock.message}</p>}
              </div>
            </div>

            {/* Right Block: Gallery and Covers */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Загрузка изображений (Галерея)</label>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Вставьте URL изображения..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#bfa075] text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                    >
                      Добавить
                    </button>
                  </div>
                  
                  {/* Upload from device trigger */}
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
              </div>

              {/* Previews and Cover selection */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Выберите Главное фото (кликните):</span>
                {imagesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span className="text-[10px]">Галерея пока пуста</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.map((img) => {
                      const isCover = coverImage === img;
                      return (
                        <div key={img} className="relative group rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm aspect-square bg-slate-50">
                          <img
                            src={img}
                            alt="preview"
                            onClick={() => handleSelectCover(img)}
                            className={`h-full w-full object-cover cursor-pointer transition-all ${
                              isCover ? "ring-2 ring-[#C5A880] ring-offset-2 dark:ring-offset-slate-950 opacity-100" : "opacity-70 hover:opacity-100"
                            }`}
                          />
                          {isCover && (
                            <span className="absolute left-1 top-1 bg-[#C5A880] text-white rounded-full p-0.5 shadow-md">
                              <CheckCircle className="h-3 w-3" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img)}
                            className="absolute right-1 top-1 p-0.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 p-2.5 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/30 text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Ссылка на Главное фото автоматически обновится при выборе карточки выше.</span>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#C5A880] hover:bg-[#b0936b] text-white text-xs font-bold tracking-wide transition-all shadow-md shadow-[#C5A880]/10"
            >
              Создать товар
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
