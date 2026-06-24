import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark-first surfaces from the styling guide.
        bg: "#0F1115",
        surface: "#16181D",
        elevated: "#1E2128",
        hairline: "#262A32",
        fg: "#E6E8EC",
        muted: "#8B8F99",
        // One reserved accent: a calm, cool green.
        accent: "#34D399",
        "accent-dim": "#1F7A5A",
        over: "#F26D6D",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fixed type scale: 12 / 14 / 16 / 20 / 28 / 40.
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "26px" }],
        xl: ["28px", { lineHeight: "32px" }],
        hero: ["40px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
      },
      maxWidth: {
        col: "440px",
      },
      spacing: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
