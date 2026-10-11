import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17140f",
        cream: "#f5f0e1",
        sand: "#ebe5d3",
        sun: "#f3d35b",
        "sun-deep": "#e6bd35",
        blush: "#f2b5d9",
        "blush-deep": "#e898c6",
        olive: "#9bab5a",
        "olive-deep": "#7f9145",
        sky: "#b4c3ec",
        "sky-deep": "#8c9fdb",
        coral: "#c2362d",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "#17140f",
          foreground: "#f5f0e1",
        },
        secondary: {
          DEFAULT: "#ebe5d3",
          foreground: "#17140f",
        },
        muted: {
          DEFAULT: "#e3dcc6",
          foreground: "#6b6554",
        },
        accent: {
          DEFAULT: "#f3d35b",
          foreground: "#17140f",
        },
        destructive: {
          DEFAULT: "#c2362d",
          foreground: "#f5f0e1",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-instrument)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-bricolage)", "var(--font-instrument)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0 0 #17140f",
        "brutal-lg": "6px 6px 0 0 #17140f",
        "brutal-sm": "2px 2px 0 0 #17140f",
        "brutal-hover": "2px 2px 0 0 #17140f",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
