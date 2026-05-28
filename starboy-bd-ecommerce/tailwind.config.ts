import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f0",
          100: "#f9f0de",
          200: "#f3e0b8",
          300: "#eacc86",
          400: "#e0b35c",
          500: "#d4a040",
          600: "#b8860b",
          700: "#946a08",
          800: "#7a580a",
          900: "#66490e",
          950: "#1a1505",
        },
        ink: {
          50: "#f6f4f0",
          100: "#e7e3db",
          200: "#d1cbbf",
          300: "#b0a68e",
          400: "#88806d",
          500: "#6d6655",
          600: "#5d5648",
          700: "#4f493d",
          800: "#453f35",
          900: "#1f1b14",
          950: "#0f0d08",
        },
        surface: {
          DEFAULT: "#F7F3EC",
          dark: "#0f0d08",
          card: "#FFFFFF",
          warm: "#F2EBDF",
        },
        bronze: {
          light: "#C9A96E",
          DEFAULT: "#B8860B",
          dark: "#8B6914",
          deep: "#5C470A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(26, 21, 5, 0.06)",
        glow: "0 0 40px -10px rgba(184, 134, 11, 0.25)",
        premium: "0 20px 50px -12px rgba(26, 21, 5, 0.12)",
        warm: "0 8px 30px -4px rgba(139, 105, 20, 0.12)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
