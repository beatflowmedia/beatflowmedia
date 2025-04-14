/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"], // Ensure it scans all files
  theme: {
    extend: {
      colors: {
        primary: "#181818",
        secondary: "#1DB954",
        textLight: "#b3b3b3",
      },
    },
  },
  plugins: [],
};

export default config;
