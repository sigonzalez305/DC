/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dc-blue': '#003B71',
        'dc-red': '#DC002E',
      },
    },
  },
  plugins: [],
}
