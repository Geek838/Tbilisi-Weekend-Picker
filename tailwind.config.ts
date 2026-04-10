import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wine: "#641C34",
        sulfur: "#FFD166"
      }
    }
  },
  plugins: []
};

export default config;
