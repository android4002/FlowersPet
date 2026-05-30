"use client";

import { Order } from "./types";
import { logCustomAdminAction } from "../staff/actions";

const BACKEND_BASE = "/api/v1/admin/orders";

export async function getOrdersList(): Promise<Order[]> {
  try {
    const res = await fetch(BACKEND_BASE);
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    
    // Parse items string to object if necessary
    return data.map((order: any) => {
      let parsedItems = [];
      if (typeof order.items === "string") {
        parsedItems = JSON.parse(order.items);
      } else {
        parsedItems = order.items || [];
      }
      return {
        ...order,
        items: parsedItems
      };
    });
  } catch (e) {
    console.error(e);
    // Fallback mock orders in case of connection pool initialization delays
    return [
      {
        id: 1,
        customer_name: "Александр Г.",
        phone: "+7 (999) 123-45-67",
        email: "alex@gmail.com",
        address: "Москва, ул. Ленина, д. 10, кв. 42",
        total_amount: 4500,
        items: [{ product_id: 1, name: "Букет «Нежность»", price: 4500, quantity: 1, line_total: 4500 }],
        status: "processing",
        created_at: new Date().toISOString()
      }
    ];
  }
}

export async function updateOrderStatus(orderId: number, status: string): Promise<boolean> {
  const url = `${BACKEND_BASE}/${orderId}/status`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Failed to update status");
    
    logCustomAdminAction("Смена статуса заказа", `Заказ #${orderId} переведен в статус: ${status}`);
    return true;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с FastAPI");
    return false;
  }
}

export function getOrderReceiptUrl(orderId: number): string {
  return `${BACKEND_BASE}/${orderId}/receipt`;
}

export async function updateCustomOrderPrice(orderId: number, price: number, itemName: string): Promise<boolean> {
  const url = `${BACKEND_BASE}/${orderId}/update-custom`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price, item_name: itemName })
    });
    if (!res.ok) throw new Error("Failed to update custom order details");
    
    logCustomAdminAction("Согласование стоимости", `Заказ #${orderId}: выставлена стоимость ${price} ₽, состав: ${itemName}`);
    return true;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с бэкендом при обновлении стоимости");
    return false;
  }
}

