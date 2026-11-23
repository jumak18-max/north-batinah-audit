/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./**/*.{js,ts,jsx,tsx,html}", "./index.html"],
  theme: {
    extend: {
      colors: { teal: "#0d6e6b", teal2: "#0a4f4d", ink: "#102a2c" },
    },
  },
  plugins: [],
};
