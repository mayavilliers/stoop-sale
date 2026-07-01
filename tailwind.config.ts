import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — see app/globals.css for the source-of-truth CSS vars.
        ink: "var(--ink)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        line: "var(--line)",
        // price-sticker red — primary actions
        sticker: {
          DEFAULT: "var(--sticker)",
          ink: "var(--sticker-ink)",
        },
        // kraft / masking-tape tan — secondary chips
        kraft: "var(--kraft)",
        sky: { DEFAULT: "var(--sky)", ink: "var(--sky-ink)" },
        terra: { DEFAULT: "var(--terra)", ink: "var(--terra-ink)" },
        // fluorescent poster green — reserved for "Open now" only
        live: {
          DEFAULT: "var(--live)",
          ink: "var(--live-ink)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,23,20,0.06), 0 8px 24px -12px rgba(26,23,20,0.18)",
        pop: "0 12px 32px -10px rgba(26,23,20,0.30)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
