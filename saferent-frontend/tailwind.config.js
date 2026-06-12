/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // SafeRent palette: civic, trustworthy, brick-and-mortar Hamilton.
        ink: "#1A1F23",        // near-black text
        paper: "#F7F5F0",      // warm off-white background
        brick: "#B5482A",      // Hamilton brick red — primary action
        slateblue: "#3E5C76",  // calm institutional blue — secondary
        moss: "#5A7D5A",       // confirmation green
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        body: ["'Public Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
