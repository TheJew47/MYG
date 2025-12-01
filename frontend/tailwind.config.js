/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#0B0E14",       // Deep Midnight Blue
          card: "#161B26",     // Rich Blue-Grey (Fixed the "gray" look)
          border: "#232D3F",   // Lighter Blue border
          input: "#1C232E",    // Input fields
          hover: "#2D3748"
        },
        text: {
          main: "#E0E6ED",     // Cool White
          muted: "#94A3B8",    // Blue-ish Grey text
          accent: "#3B82F6",   // Primary Blue
          error: "#EF4444",    // Bright Red
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}