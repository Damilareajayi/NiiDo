import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NiiDo Brand — warm, African, trustworthy
        brand: {
          50:  "#fdf6ee",
          100: "#fae8d0",
          200: "#f5cfa0",
          300: "#efaf65",
          400: "#e8893a",
          500: "#e2701c", // primary orange — energy, warmth
          600: "#d45712",
          700: "#b04010",
          800: "#8c3314",
          900: "#712c13",
          950: "#3d1308",
        },
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6", // secondary teal — calm, learning
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        earth: {
          50:  "#faf7f2",
          100: "#f0e9db",
          200: "#dfd0b8",
          300: "#c9b08d",
          400: "#b38f64",
          500: "#a07848", // earth brown — grounded, African
          600: "#8a6339",
          700: "#714f2f",
          800: "#5e4129",
          900: "#4f3724",
        },
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
