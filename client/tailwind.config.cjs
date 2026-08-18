module.exports = {
  mode: "jit",
  prefix: "tw-",
  content: ["./src/**/*.{vue,ts,tsx,js,jsx}", "./src/**/*.scss"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        accent: "#22c55e",
      },
      spacing: {
        "2xs": "4px",
        xs: "8px",
        sm: "16px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "\"Noto Sans\"",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        base: ["14px", "1.5"],
        lg: ["16px", "1.5"],
      },
    },
  },
  plugins: [],
};