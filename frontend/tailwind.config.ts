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
        // NiiDo Brand — from the official niido-brand kit, shared with EduPrompt
        brand: {
          // Primary — wordmark purple (#7c3aed), used for CTAs, active states, NiiDo Teach
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa", // "Purple Light" — dark-mode wordmark
          500: "#8b5cf6",
          600: "#7c3aed", // "EduPrompt Purple" — exact brand hex
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        teal: {
          // Dot: growth, adaptability — used for NiiDo Read
          50:  "#edfcf9",
          100: "#d2f7ef",
          200: "#a9eee0",
          300: "#72e0cd",
          400: "#3bcab5",
          500: "#00a896", // exact brand hex
          600: "#00897a",
          700: "#036b62",
          800: "#0a544d",
          900: "#0b4641",
          950: "#002e2a",
        },
        sky: {
          // Dot: open possibility, reach — used for NiiDo Pulse
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8", // exact brand hex
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        coral: {
          // Dot: energy, inclusion, neurodiversity — used for support/highlight accents
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e", // exact brand hex
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        navy: {
          // Dark backgrounds — brand's "Dark Navy"
          DEFAULT: "#1a1a2e",
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
  plugins: [require("@tailwindcss/typography")],
};

export default config;
