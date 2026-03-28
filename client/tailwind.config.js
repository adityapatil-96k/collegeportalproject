/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "rgba(30, 41, 59, 0.7)",
        accent: {
          start: "#3b82f6",
          end: "#8b5cf6",
        }
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
