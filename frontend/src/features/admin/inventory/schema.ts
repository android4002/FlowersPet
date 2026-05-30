import { z } from "zod";

export const ProductCreateSchema = z.object({
  name: z.string().min(3, "Название должно содержать минимум 3 символа"),
  category: z.enum(["Букеты", "Комнатные", "Суккуленты"], {
    errorMap: () => ({ message: "Выберите корректную категорию" }),
  }),
  price: z.number().positive("Цена должна быть положительным числом"),
  discount_price: z.number().positive("Цена со скидкой должна быть положительным числом").nullable().optional(),
  stock: z.number().int().nonnegative("Остаток должен быть целым неотрицательным числом"),
  is_active: z.boolean().default(true),
  image_url: z.string().url("Укажите корректную ссылку на изображение"),
  images: z.array(z.string().url()).min(1, "Добавьте хотя бы одно изображение"),
});

export const ProductQuickEditSchema = z.object({
  price: z.number().positive("Цена должна быть положительной").optional(),
  stock: z.number().int().nonnegative("Остаток должен быть неотрицательным").optional(),
});

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductQuickEditInput = z.infer<typeof ProductQuickEditSchema>;
