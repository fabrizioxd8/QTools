import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from 'fs';
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Try to use the same mkcert certificates as the server
  const certPath = path.join(__dirname, 'server', 'certs');
  const keyFile = path.join(certPath, 'key.pem');
  const certFile = path.join(certPath, 'cert.pem');

  let httpsConfig = true; // fallback to basic SSL

  try {
    if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
      httpsConfig = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile)
      };
      console.log('✅ Using mkcert certificates for Vite dev server');
    }
  } catch (error) {
    console.log('⚠️  Using basic SSL for Vite dev server');
  }

  return {
    server: {
      host: "0.0.0.0", // Allow external connections
      port: 8080,
      https: httpsConfig,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
