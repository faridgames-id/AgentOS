/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Eduplex-inspired palette
        primary: "#3B82F6",      // Blue
        secondary: "#10B981",    // Green/Lime
        accent: "#8B5CF6",       // Purple
        navy: "#1E293B",         // Navy sidebar
        navyDark: "#0F172A",     // Dark navy
        lavender: "#E8EAF6",     // Light lavender background
        surface: "#F8FAFC",      // Card surface
      },
      fontFamily: {
        body: ['"Inter"', 'sans-serif'],
        display: ['"Dancing Script"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
