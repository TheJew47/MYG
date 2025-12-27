/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#000000",       // Pure black background for maximum contrast
          card: "#111111",     // Deep obsidian for panels/cards
          input: "#161616",    // Slightly lighter for input fields
          border: "#222222",   // Subtle hairline borders
          hover: "#1c1c1c",    // Hover states for list items
          sidebar: "#09090b",  // Distinct sidebar depth
        },
        text: {
          main: "#FFFFFF",     // Absolute white for primary text
          muted: "#888888",    // Neutral grey for secondary info
          accent: "#3b82f6",   // The signature "Pro" Blue
          error: "#ff453a",    // iOS-style vibrant red
        },
      },
      fontFamily: {
        sans: [
          '"Inter"', 
          '"Geist"', 
          '"SF Pro Display"', 
          '"Segoe UI"', 
          'sans-serif'
        ],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'premium': '0 4px 20px -5px rgba(0, 0, 0, 0.7)',
        'glow': '0 0 15px -3px rgba(59, 130, 246, 0.3)',
      },
      borderRadius: {
        'editor': '6px', // Matches the sharp, professional edges in the images
      }
    },
  },
  plugins: [],
}