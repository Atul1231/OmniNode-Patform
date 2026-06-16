/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    // We restrict themes to professional, high-contrast, low-saturation variants
    themes: ["dark", "slate", "corporate", "neutral"],
    darkTheme: "dark",
    base: true,
    utils: true,
  },
}