"use client";

import { Staff, AdminActionLog } from "./types";

const BACKEND_BASE = "/api/v1/telegram/managers";

// MOCK INITIAL DATA FOR LOGS & ACTIVITY
const INITIAL_LOGS: AdminActionLog[] = [
  { id: "101", timestamp: "2026-05-27T17:15:22Z", admin_name: "Анатолий Данилов", action: "Изменение цен", details: "Букет «Весеннее настроение» с 3400 на 3200 ₽" },
  { id: "102", timestamp: "2026-05-27T17:28:11Z", admin_name: "Анатолий Данилов", action: "Менеджмент персонала", details: "Chat ID: 67890, Разблокировал сотрудника @maria_florist" },
  { id: "103", timestamp: "2026-05-27T17:35:45Z", admin_name: "Анатолий Данилов", action: "Редактирование остатков", details: "Роза комнатная в горшке: установлен остаток 3" }
];

export async function getStaffList(): Promise<Staff[]> {
  try {
    const res = await fetch(BACKEND_BASE);
    if (!res.ok) throw new Error("Failed to fetch staff");
    const data = await res.json();
    return data.map((item: any) => ({
      id: item.id.toString(),
      chat_id: item.chat_id,
      username: item.username,
      role: item.role,
      is_active: item.is_active,
      last_activity: item.is_active ? "Активен в боте" : "Заблокирован"
    }));
  } catch (e) {
    console.error(e);
    return [
      { id: "1", chat_id: 896657679, username: "admin_user", role: "admin", is_active: true, last_activity: "2026-05-27 20:41 (Активен)" }
    ];
  }
}

export async function toggleStaffAccess(chatId: number, currentStatus: boolean): Promise<boolean> {
  const url = `${BACKEND_BASE}/${chatId}/toggle`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("Failed to toggle staff status");
    const data = await res.json();
    return data.is_active;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с FastAPI");
    return currentStatus;
  }
}

export async function sendStaffPushMessage(chatId: number, message: string): Promise<boolean> {
  const url = `/api/v1/admin/staff/${chatId}/message`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to send message");
    }
    return true;
  } catch (e: any) {
    console.error(e);
    alert(e.message || "Ошибка отправки push-уведомления");
    return false;
  }
}

const LOGS_STORAGE_KEY = "flowerspet_admin_action_logs";

function getLocalLogs(): AdminActionLog[] {
  if (typeof window === "undefined") return INITIAL_LOGS;
  const stored = localStorage.getItem(LOGS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }
  return JSON.parse(stored);
}

function saveLocalLogs(logs: AdminActionLog[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }
}

export async function getAdminActionLogs(): Promise<AdminActionLog[]> {
  try {
    const res = await fetch(`/api/v1/admin/staff/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    const data = await res.json();
    if (data && data.length > 0) return data;
    return getLocalLogs();
  } catch (e) {
    console.error(e);
    return getLocalLogs();
  }
}

export function logCustomAdminAction(action: string, details: string) {
  const logs = getLocalLogs();
  logs.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    admin_name: "Анатолий Данилов",
    action,
    details
  });
  saveLocalLogs(logs);
}

export async function sendBroadcastToStaff(message: string): Promise<boolean> {
  const url = `/api/v1/admin/staff/broadcast`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error("Failed to send broadcast alert");
    
    logCustomAdminAction("Массовая рассылка", `Отправлена рассылка: "${message.substring(0, 40)}..."`);
    return true;
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения при отправке рассылки");
    return false;
  }
}

