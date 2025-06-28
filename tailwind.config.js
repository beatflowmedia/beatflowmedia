/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // page backgrounds
        'bf-page':      '#111827',  // rgb(17,24,39)
        'bf-card':      '#1F2937',  // rgb(31,41,55)

        // text
        'bf-text':      '#E9F0F8',  // rgb(233,240,248)
        'bf-subtext':   '#8F9BB3',  // a nice slate-400–ish for secondary lines

        // accents (play, like, share icons)
        'bf-green':     '#1DB954',  // your music-note toggle
        'bf-blue':      '#4D75F0',  // your share icon
        'bf-red':       '#E22134',  // heart “liked” state
      },
    },
  },
  plugins: [],
};
