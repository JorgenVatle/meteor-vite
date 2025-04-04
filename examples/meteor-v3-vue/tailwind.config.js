/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      "client/**/*.html",
      "imports/**/*.{vue,ts,js}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
      require('@tailwindcss/typography'),
  ],
}

