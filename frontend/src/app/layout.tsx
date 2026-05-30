import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FlowersPET - Премиальный цветочный магазин",
  description: "Эксклюзивные букеты, доставка цветов и забота о ваших растениях.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body 
        className={`${inter.variable} font-sans bg-[#FDFDFD] text-[#2D2D2D] antialiased min-h-screen selection:bg-[#1E3F20]/10 selection:text-[#1E3F20]`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
