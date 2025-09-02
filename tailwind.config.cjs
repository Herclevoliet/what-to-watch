/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@shadcn/ui/**/*.{js,ts,jsx,tsx}", // ShadCN bileşenleri
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwind-animate") // Animasyonlar
  ],
};
