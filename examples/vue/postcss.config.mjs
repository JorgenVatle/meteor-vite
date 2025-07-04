export default {
  plugins: [
    require('tailwindcss/nesting'),
    require('tailwindcss')('./tailwind.config.mjs'),
    require('autoprefixer'),
  ],
}
