"use client";

import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { sendStaffPushMessage } from "../actions";

interface SendMessageModalProps {
  chatId: number;
  username: string;
  onClose: () => void;
}

export function SendMessageModal({ chatId, username, onClose }: SendMessageModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("Сообщение не может быть пустым");
      return;
    }

    setLoading(true);
    const ok = await sendStaffPushMessage(chatId, message);
    setLoading(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ✉️ Отправить сообщение в Telegram
            </h3>
            <p className="text-[10px] text-slate-400">
              Сообщение будет доставлено пользователю @{username} в реальном времени
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
        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Сообщение успешно доставлено!</h4>
            <p className="text-[10px] text-slate-400">Сотрудник получил push-уведомление в Telegram.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Получатель</label>
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-semibold">
                @{username} (Telegram ID: {chatId})
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Текст сообщения</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите текст сообщения сотруднику..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder-slate-400 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold tracking-wide transition-all shadow-md disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? "Отправка..." : "Отправить"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
