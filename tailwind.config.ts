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
        // Obsidian: near-black surfaces, vivid green accent, terminal density.
        bg: "#08080A",
        surface: "#15151A",
        elevated: "#0D0D10",
        hairline: "#232329",
        fg: "#F4F4F5",
        muted: "#86868F",
        // Very subtle text: timestamps, secondary meta.
        faint: "#55555D",
        // One reserved accent: a vivid green.
        accent: "#34D39E",
        "accent-dim": "#1F7A5A",
        // Dark ink for text on the green accent button.
        "accent-ink": "#06120D",
        over: "#F87171",
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Fixed type scale: 12 / 14 / 16 / 20 / 28 / 40.
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "26px" }],
        xl: ["28px", { lineHeight: "32px" }],
        hero: ["42px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
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
