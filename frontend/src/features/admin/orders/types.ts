export interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
  occasion?: string;
  budget?: number;
  colors?: string[];
  wishes?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  total_amount: number;
  items: OrderItem[];
  status: "pending" | "processing" | "delivering" | "completed" | "cancelled";
  created_at: string;
}
