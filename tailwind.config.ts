import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arias: {
          DEFAULT: "#0052CC",
          50: "#E8F0FE",
          100: "#C7DAFB",
          200: "#9DBCF7",
          300: "#6E9CF1",
          400: "#3F7DEB",
          500: "#0052CC",
          600: "#0044A8",
          700: "#003584",
          800: "#002761",
          900: "#001A40",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -4px rgb(0 82 204 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
