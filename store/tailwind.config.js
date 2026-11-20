/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        febric: {
          dark: '#202027',
          pink: '#e60055',
          coral: '#ff673c',
          gold: '#dc9814',
          green: '#3bb54a',
          bg: '#fff8f5',
          muted: '#6b7280'
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'sans-serif'],
        heading: ['Lexend Deca', 'sans-serif'],
        lexend: ['Lexend Deca', 'sans-serif'],
        montserrat: ['Montserrat', 'Arial', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif']
      }
    },
  },
  plugins: [],
}
