import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand accent — green (compliance / "go" / sustainability).
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // Near-black used for primary buttons and dark CTA bands.
        ink: {
          DEFAULT: "#0a0a0b",
          50: "#f6f6f7",
          100: "#e7e7e9",
          200: "#cfcfd3",
          300: "#a8a8af",
          400: "#76767f",
          500: "#52525a",
          600: "#3f3f46",
          700: "#2b2b30",
          800: "#19191c",
          900: "#0f0f11",
          950: "#0a0a0b",
        },
        // Soft pastel accents used inside product mockups.
        pastel: {
          yellow: "#fef9c3",
          pink: "#fce7f3",
          lilac: "#ede9fe",
          mint: "#dcfce7",
          sky: "#e0f2fe",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.08)",
        card: "0 1px 3px rgba(16, 24, 40, 0.06), 0 12px 32px rgba(16, 24, 40, 0.10)",
        glow: "0 0 0 1px rgba(20,184,166,0.25), 0 20px 60px -20px rgba(20,184,166,0.45)",
      },
      backgroundImage: {
        "grid-light":
          "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
