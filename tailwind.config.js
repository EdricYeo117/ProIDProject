/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        npBlue: "#003D5C",
        npGold: "#FFB81C",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
