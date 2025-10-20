/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['nunito', 'sans serif'],
      },
      letterSpacing: {
        thigher: '0%',
      },
      fontSize: {
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        xxl: '24px',
        xxxl: '28px',
        big: '32px',
      },
      lineHeight: {
        tigh: '24px',
        tigher: '28px',
        tighest: '30px',
      },
      colors: {
        primary: '#242424',
        secondary: '#FDFF00',
        tertiary: '#282E3C',
      },
      borderRadius: {
        base: '6px',
        lg: '8px',
        xl: '12px',
        xxl: '16px',
      },
    },
  },
  plugins: [],
}
