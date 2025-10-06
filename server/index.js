import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeDatabase } from './database.js';
import toolsRouter from './routes/tools.js';
import workersRouter from './routes/workers.js';
import projectsRouter from './routes/projects.js';
import assignmentsRouter from './routes/assignments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Get local IP address
const getLocalIP = () => {
  const nets = networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Return the first non-internal IPv4 address
  for (const name of Object.keys(results)) {
    if (results[name].length > 0) {
      return results[name][0];
    }
  }
  return 'localhost';
};

const localIP = getLocalIP();

// Middleware - Allow access from any origin on the local network
app.use(cors({
  origin: true, // Allow all origins for local development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Initialize database
initializeDatabase();

// Routes
app.use('/api/tools', toolsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/assignments', assignmentsRouter);

// Root route - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'QTools API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      tools: '/api/tools',
      workers: '/api/workers',
      projects: '/api/projects',
      assignments: '/api/assignments'
    },
    frontend: `https://${localIP}:8082`,
    documentation: 'Visit the frontend application for the full QTools interface'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: `https://${localIP}:${PORT}`
  });
});

// Try to use mkcert certificates, fallback to self-signed
const certPath = join(__dirname, 'certs');
const keyFile = join(certPath, 'key.pem');
const certFile = join(certPath, 'cert.pem');

let httpsOptions;

try {
  // Check if mkcert certificates exist
  if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
    httpsOptions = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    };
    console.log('✅ Using mkcert certificates');
  } else {
    throw new Error('mkcert certificates not found');
  }
} catch (error) {
  console.log('⚠️  mkcert certificates not found, using fallback...');
  console.log('💡 For better network access, install mkcert and run the setup script');
  
  // Fallback to basic self-signed certificate
  const pem = await import('pem');
  const keys = await new Promise((resolve, reject) => {
    pem.default.createCertificate({ 
      days: 365, 
      selfSigned: true,
      altNames: ['localhost', '127.0.0.1', localIP]
    }, (err, keys) => {
      if (err) reject(err);
      else resolve(keys);
    });
  });
  
  httpsOptions = {
    key: keys.serviceKey,
    cert: keys.certificate
  };
}

const httpsServer = https.createServer(httpsOptions, app);

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 QTools Server Started Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Local Access:     https://localhost:${PORT}`);
  console.log(`🌐 Network Access:   https://${localIP}:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 Access from mobile devices using the network URL');
  console.log('⚠️  You may need to accept certificate warnings on first visit');
  console.log('💡 For trusted certificates, run: npm run setup-certs\n');
});