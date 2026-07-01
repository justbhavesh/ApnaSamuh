/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Devanagari"', "system-ui", "sans-serif"],
      },
      colors: {
        paid: "#15803d",
        pending: "#ea580c",
        late: "#dc2626",
        fund: "#1d4ed8",
      },
    },
  },
  plugins: [],
};
