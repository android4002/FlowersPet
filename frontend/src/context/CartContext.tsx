"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  images?: string[];
  details?: Record<string, string>;
  sort_order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_CART"; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === action.payload.id
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;

        if (newQuantity <= existingItem.product.stock) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };
        } else {
          alert(`Недостаточно товара на складе! Доступно всего ${existingItem.product.stock} шт.`);
          return state;
        }
        return { ...state, items: updatedItems };
      }

      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
    }

    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.product.id !== id),
        };
      }

      return {
        ...state,
        items: state.items.map((item) => {
          if (item.product.id === id) {
            if (quantity <= item.product.stock) {
              return { ...item, quantity };
            } else {
              alert(`Доступно всего ${item.product.stock} шт. на складе.`);
              return { ...item, quantity: item.product.stock };
            }
          }
          return item;
        }),
      };
    }

    case "CLEAR_CART": {
      return { ...state, items: [] };
    }

    case "SET_CART": {
      return { ...state, items: action.payload };
    }

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage post-mount to fully prevent server-side hydration mismatches
  useEffect(() => {
    const savedCart = localStorage.getItem("flowerspet-cart");
    if (savedCart) {
      try {
        dispatch({ type: "SET_CART", payload: JSON.parse(savedCart) });
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage when state items change
  useEffect(() => {
    localStorage.setItem("flowerspet-cart", JSON.stringify(state.items));
  }, [state.items]);

  const cartTotal = state.items.reduce((total, item) => {
    const activePrice =
      item.product.discountPrice !== null &&
      item.product.discountPrice !== undefined &&
      item.product.discountPrice < item.product.price
        ? item.product.discountPrice
        : item.product.price;
    return total + activePrice * item.quantity;
  }, 0);

  const cartItemCount = state.items.reduce((count, item) => count + item.quantity, 0);

  const addItem = (product: Product) => dispatch({ type: "ADD_ITEM", payload: product });
  const removeItem = (id: number) => dispatch({ type: "REMOVE_ITEM", payload: id });
  const updateQuantity = (id: number, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cartTotal,
        cartItemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
