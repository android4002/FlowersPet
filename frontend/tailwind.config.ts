import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        organicGreen: "#0C3322",
        softWhite: "#FDFDFD",
        accentGold: "#FFD700",
        softBeige: "#D2B48C",
        // Supporting premium palette colors
        darkForest: "#051A11",
        mintLight: "#E8F0EA",
        charcoal: "#2D2D2D",
        // Nude & Beige premium colors
        nudeWarm: "#E8D8C8",
        nudeSoft: "#F7F3EE",
        nudeGold: "#D4AF37",
        nudeClay: "#C5A880",
      },
      borderRadius: {
        custom: "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
