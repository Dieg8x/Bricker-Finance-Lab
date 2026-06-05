/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        brand: "#1F4E79",
        gold: "#F4B942",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 24, 40, 0.10)",
      },
    },
  },
  plugins: [],
};
