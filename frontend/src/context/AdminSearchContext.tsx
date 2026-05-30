"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type AdminSearchAction =
  | { type: "open_order"; orderId: number }
  | { type: "open_product"; productId: string }
  | null;

interface AdminSearchContextValue {
  action: AdminSearchAction;
  dispatch: (action: AdminSearchAction) => void;
  clear: () => void;
}

const AdminSearchContext = createContext<AdminSearchContextValue>({
  action: null,
  dispatch: () => {},
  clear: () => {},
});

export function AdminSearchProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<AdminSearchAction>(null);

  const dispatch = useCallback((a: AdminSearchAction) => setAction(a), []);
  const clear = useCallback(() => setAction(null), []);

  return (
    <AdminSearchContext.Provider value={{ action, dispatch, clear }}>
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  return useContext(AdminSearchContext);
}
