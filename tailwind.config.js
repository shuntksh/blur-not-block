/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./src/**/*.{tsx,jsx,css}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
