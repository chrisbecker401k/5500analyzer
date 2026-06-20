import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        everhart: {
          blue: "#005596",
          orange: "#F08A5C",
          lightBlue: "#9AC8E3",
          green: "#C6DA8D",
          gray: "#A1A1A4",
          charcoal: "#404040"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0, 85, 150, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
