"use client";

import { Product } from "./types";
import { ProductCreateInput } from "./schema";
import { logCustomAdminAction } from "../staff/actions";

const BACKEND_BASE = "/api/v1/products";

// MOCK INITIAL PRODUCTS (only for absolute failure fallback)
const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Букет «Весеннее настроение»", category: "Букеты", price: 3200, base_price: 3200, discount_price: null, stock: 12, is_active: true, image_url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400", images: ["https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400"], sort_order: 1 },
  { id: "2", name: "Роза комнатная в горшке", category: "Комнатные", price: 1500, base_price: 1500, discount_price: 1200, stock: 3, is_active: true, image_url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400", images: ["https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400"], sort_order: 2 }
];

export async function getProductsList(page: number = 1, limit: number = 10): Promise<Product[]> {
  try {
    const res = await fetch(`${BACKEND_BASE}/?page=${page}&limit=${limit}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return data.map((prod: any) => {
      let catName: Product["category"] = "Букеты";
      if (prod.category_id === 2 || prod.name.includes("Делициоза") || prod.name.includes("Фикус") || prod.name.includes("Орхидея")) {
        catName = "Комнатные";
      } else if (prod.name.includes("Кактус") || prod.name.includes("Суккулент")) {
        catName = "Суккуленты";
      }
      return {
        id: prod.id.toString(),
        name: prod.name,
        category: catName,
        price: Number(prod.price),
        base_price: Number(prod.base_price),
        discount_price: prod.discount_price ? Number(prod.discount_price) : null,
        stock: prod.stock,
        is_active: prod.is_active,
        image_url: prod.image_url || "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&q=80&w=400",
        images: prod.images || [],
        sort_order: prod.sort_order || prod.id,
        description: prod.description || ""
      };
    });
  } catch (e) {
    console.error(e);
    return INITIAL_PRODUCTS;
  }
}

export async function updateProductDetails(id: string, data: Partial<Product>): Promise<boolean> {
  const url = `${BACKEND_BASE}/${id}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update product");
    
    logCustomAdminAction("Синхронизация каталога", `Товар #${id}: обновлены свойства ${Object.keys(data).join(", ")}`);
    return true;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с FastAPI");
    return false;
  }
}

export async function updateProductPrice(id: string, price: number): Promise<boolean> {
  return updateProductDetails(id, { base_price: price } as any);
}

export async function updateProductStock(id: string, stock: number): Promise<boolean> {
  return updateProductDetails(id, { stock } as any);
}

export async function createProduct(input: any): Promise<any> {
  try {
    const res = await fetch("/api/v1/products/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        category: input.category,
        price: Number(input.price),
        discount_price: input.discount_price ? Number(input.discount_price) : null,
        stock: Number(input.stock),
        is_active: Boolean(input.is_active),
        image_url: input.image_url,
        images: input.images && input.images.length > 0 ? input.images : [input.image_url]
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create product");
    }
    const result = await res.json();
    logCustomAdminAction("Создание товара", `Создан товар: ${input.name} (ID: ${result.id})`);
    return result;
  } catch (e: any) {
    console.error("Error creating product:", e);
    alert(e.message || "Ошибка подключения к бэкенду при создании товара");
    throw e;
  }
}

export async function updateProductsSortOrder(idList: string[]): Promise<any[]> {
  try {
    const res = await fetch(`${BACKEND_BASE}/sort-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: idList.map(Number)
      })
    });
    if (!res.ok) throw new Error("Failed to save sort order");
    
    logCustomAdminAction("Сортировка товаров", `Сохранен новый порядок для ${idList.length} товаров`);
    return [];
  } catch (e: any) {
    console.error("Error saving sort order:", e);
    alert("Ошибка сохранения порядка сортировки товаров на сервере");
    return [];
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const url = `${BACKEND_BASE}/${id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete product");
    
    logCustomAdminAction("Удаление товара", `Удален товар #${id}`);
    return true;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с FastAPI при удалении товара");
    return false;
  }
}

export async function uploadProductImage(file: File): Promise<string | null> {
  const url = `${BACKEND_BASE}/upload`;
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to upload image");
    }
    const result = await res.json();
    return result.url;
  } catch (e: any) {
    console.error("Error uploading image:", e);
    alert(e.message || "Ошибка загрузки фото");
    return null;
  }
}
