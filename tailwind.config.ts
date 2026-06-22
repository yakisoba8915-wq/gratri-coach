import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ice: "#eaf7fb", navy: "#102f44", glacier: "#0b91a8" }, boxShadow: { card: "0 10px 30px rgba(16,47,68,.08)" } } },
  plugins: []
} satisfies Config;
