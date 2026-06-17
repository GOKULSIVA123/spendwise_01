/** @type {import('tailwindcss').Config} */
export default {
  // The 'content' path is still needed
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],

  // This tells Tailwind to get its theme from your CSS file
  theme: {
    extend: {},
  },
  plugins: [],
};
