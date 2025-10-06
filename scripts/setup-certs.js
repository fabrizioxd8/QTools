import { execSync } from 'child_process';
import { networkInterfaces } from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get local IP address
const getLocalIP = () => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();
const certDir = path.join(__dirname, '..', 'server', 'certs');

console.log('🔐 Setting up SSL certificates for QTools...\n');

try {
  // Check if mkcert is installed
  try {
    execSync('mkcert -version', { stdio: 'pipe' });
    console.log('✅ mkcert is installed');
  } catch (error) {
    console.log('❌ mkcert is not installed');
    console.log('\n📋 Installation Instructions:');
    console.log('Windows (with Chocolatey): choco install mkcert');
    console.log('Windows (with Scoop): scoop bucket add extras && scoop install mkcert');
    console.log('macOS: brew install mkcert');
    console.log('Linux: Check https://github.com/FiloSottile/mkcert#installation');
    console.log('\nAfter installing mkcert, run: npm run setup-certs');
    process.exit(1);
  }

  // Create certs directory
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
    console.log('📁 Created certificates directory');
  }

  // Install local CA
  console.log('🔧 Installing local Certificate Authority...');
  execSync('mkcert -install', { stdio: 'inherit' });

  // Generate certificates
  console.log(`🔑 Generating certificates for localhost and ${localIP}...`);
  const certCommand = `mkcert -key-file "${path.join(certDir, 'key.pem')}" -cert-file "${path.join(certDir, 'cert.pem')}" localhost 127.0.0.1 ${localIP}`;
  
  execSync(certCommand, { stdio: 'inherit', cwd: certDir });

  console.log('\n✅ SSL certificates created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 Certificates location:', certDir);
  console.log(`🌐 Your server will be accessible at: https://${localIP}:3000`);
  console.log('📱 Mobile devices on the same network can now access without certificate warnings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🚀 You can now start the server with: npm run server');

} catch (error) {
  console.error('❌ Error setting up certificates:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure mkcert is installed and in your PATH');
  console.log('2. Try running as administrator/sudo if needed');
  console.log('3. Check that no antivirus is blocking the certificate creation');
  process.exit(1);
}