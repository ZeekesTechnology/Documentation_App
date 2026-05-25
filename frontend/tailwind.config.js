import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{js,ts,jsx,tsx}"),
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#141414",
          panel: "#1c1c1c",
          surface: "#242424",
          border: "#333333",
          muted: "#9ca3af",
          green: "#6daa3c",
          "logo-green": "#74cba1",
          "green-hover": "#5f9634",
          blue: "#4a9eff",
          link: "#5eb3ff",
        },
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
