/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2b2f3a',
          800: '#1f2937',
          850: '#1b2330',
        },
      },
    },
  },
  plugins: [],
};
