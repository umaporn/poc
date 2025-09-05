// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // ✅ disable in dev
});

module.exports = withPWA({
  reactStrictMode: true,
});
