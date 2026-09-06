/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#534AB7",
        "primary-light": "#EEEDFE",
        teal: "#1D9E75",
        surface: {
          light: "#f8fafc",
          dark: "#f1f5f9",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 400ms ease-out",
      },
    },
  },
  plugins: [],
};
