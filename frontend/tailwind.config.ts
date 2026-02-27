import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f5f6",
          100: "#e5e5e7",
          200: "#ccced1",
          300: "#a8abb0",
          400: "#7d8189",
          500: "#555961",
          600: "#3a3d43",
          700: "#252830",
          800: "#181a1f",
          900: "#0C0E10",
        },
        accent: {
          300: "#67d4e8",
          400: "#38bcd8",
          500: "#0ea5c2",
          600: "#007BA0",
          700: "#006080",
        },
      },
    },
  },
  plugins: [],
};

export default config;
