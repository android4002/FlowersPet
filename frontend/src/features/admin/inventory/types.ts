export interface Product {
  id: string;
  name: string;
  category: "Букеты" | "Комнатные" | "Суккуленты";
  price: number;
  base_price: number;
  discount_price: number | null;
  stock: number;
  is_active: boolean;
  image_url: string;
  images: string[];
  sort_order: number;
  description?: string;
}
