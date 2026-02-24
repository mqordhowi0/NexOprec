/** @type {import('tailwindcss').Config} */
export default {
  // Nyari class tailwind di file index.html dan semua file di dalam folder src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}