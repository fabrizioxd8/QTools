import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// 1. Remove the basicSsl import
// import basicSsl from "@vitejs/plugin-basic-ssl";
import { componentTagger } from "lovable-tagger";
import fs from "fs"; // 2. Add the 'fs' import to read files

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // 3. Replace 'https: true' with this object pointing to your mkcert files
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),
      cert: fs.readFileSync('./localhost+3.pem'),
    },
  },
  // 4. Remove basicSsl() from the plugins array
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));