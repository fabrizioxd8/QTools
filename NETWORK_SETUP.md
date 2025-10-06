# QTools Network Setup Guide

This guide will help you set up QTools to work across multiple devices on your local network with trusted SSL certificates.

## Quick Setup

### 1. Install mkcert (One-time setup)

**Windows:**
```bash
# Using Chocolatey
choco install mkcert

# Using Scoop
scoop bucket add extras
scoop install mkcert
```

**macOS:**
```bash
brew install mkcert
```

**Linux:**
```bash
# Check https://github.com/FiloSottile/mkcert#installation for your distribution
```

### 2. Generate SSL Certificates
```bash
npm run setup-certs
```

This will:
- Install the local Certificate Authority on your system
- Generate trusted SSL certificates for localhost and your local IP
- Create certificates that work across all devices on your network

### 3. Start the Application
```bash
# Start both backend and frontend
npm start

# Or start them separately:
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend development server
npm run dev
```

## Access URLs

After setup, you can access QTools from:

- **Local computer:** `https://localhost:8080`
- **Other devices:** `https://[YOUR-IP]:8080`
  - Replace `[YOUR-IP]` with your computer's local IP address
  - The setup script will display your IP address

## Finding Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**macOS/Linux:**
```bash
ifconfig
```
Look for your network interface (usually `en0` on Mac, `eth0` or `wlan0` on Linux).

## Troubleshooting

### Certificate Warnings
- **First time:** You may see a security warning - click "Advanced" → "Proceed to [site]"
- **Mobile devices:** You might need to accept the certificate once per device

### Can't Access from Other Devices
1. Check that both devices are on the same network
2. Verify your firewall isn't blocking ports 3000 and 8080
3. Make sure you're using `https://` (not `http://`)

### mkcert Issues
- **Windows:** Try running PowerShell as Administrator
- **macOS:** You might need to enter your password when installing the CA
- **Linux:** Check if you have the required dependencies installed

## Network Security

- Certificates are only valid for your local network
- The server only accepts connections from your local network
- Data is encrypted with HTTPS
- No external internet access required

## Production Deployment

For production use:
```bash
npm run start:prod
```

This builds the frontend for production and serves it alongside the backend.