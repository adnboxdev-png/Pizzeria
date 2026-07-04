import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        masa: "#FBF6EE",
        tomate: "#C1440E",
        tomateOsc: "#8F2E0A",
        albahaca: "#2F4B3C",
        queso: "#F2B441",
        carbon: "#232323",
        humo: "#6B6259"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
