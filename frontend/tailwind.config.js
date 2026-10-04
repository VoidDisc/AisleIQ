/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        surfaceHighlight: '#2A2A2A',
        primary: '#8B5CF6',
        primaryHover: '#7C3AED',
        text: '#E5E7EB',
        textMuted: '#9CA3AF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}
