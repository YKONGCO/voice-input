/** @type {import('@tailwindcss/vite').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [import('tailwind-scrollbar')] // 仅保留你需要的滚动条插件
};