import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on all interfaces (still safe behind tunnel)
    port: 5173,
    allowedHosts: ["edric-yeo.com", "www.edric-yeo.com"],
    proxy: {
      "/api": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://localhost:8443",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
