/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        disaster: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
          resolved: '#10b981',
          dark: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
}
