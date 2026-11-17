/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: {
            DEFAULT: '#991B1B', // Dark Red
            light: '#DC2626',
            dark: '#7F1D1D',
            deep: '#5c1010',
          },
          orange: {
            DEFAULT: '#EA580C', // Secondary Orange
            light: '#FB923C',
            dark: '#C2410C',
          },
          cream: {
            DEFAULT: '#FAF7F2',
            card: '#FFFDF9',
            border: '#EBE5D8',
          },
          charcoal: {
            DEFAULT: '#1E293B',
            dark: '#0F172A',
            muted: '#64748B',
          },
          veg: '#16A34A',
          nonveg: '#DC2626',
          egg: '#D97706',
        }
      },
      fontFamily: {
        heading: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(234, 88, 12, 0.25)',
        'redglow': '0 0 25px rgba(153, 27, 27, 0.35)',
      }
    },
  },
  plugins: [],
}
