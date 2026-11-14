/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        subtle: "#F9F9F8",
        hairline: "#EAEAEA",
        ink: "#111111",
        charcoal: "#2F3437",
        muted: "#787774",
        pastel: {
          redBg: "#FDEBEC",
          redText: "#9F2F2D",
          blueBg: "#E1F3FE",
          blueText: "#1F6C9F",
          greenBg: "#EDF3EC",
          greenText: "#346538",
          yellowBg: "#FBF3DB",
          yellowText: "#956400"
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Helvetica Neue'", "sans-serif"],
        serif: ["'Instrument Serif'", "'Newsreader'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    }
  },
  plugins: []
};
