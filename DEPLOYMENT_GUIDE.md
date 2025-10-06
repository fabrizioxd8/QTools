# 🚀 QTools Deployment Guide for Visual Studio Code

## 📋 Overview
Complete guide to set up and run QTools in Visual Studio Code with integrated terminal management, debugging, and network access.

---

## 🛠️ Prerequisites

### Required Software
- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **Visual Studio Code** - [Download here](https://code.visualstudio.com/)
- **Git** - [Download here](https://git-scm.com/)

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## 🚀 Quick Start in VS Code

### 1. Clone & Open Project
```bash
# Clone your repository
git clone <your-repo-url>
cd QTools

# Open in VS Code
code .
```

### 2. Install Dependencies
**In VS Code Terminal** (`Ctrl+` ` or `View > Terminal`):
```bash
npm install
```

### 3. Set Up SSL Certificates (One-time)
```bash
npm run setup-certs
```

### 4. Start the Application
```bash
npm start
```

---

## 🎯 VS Code Integration

### VS Code Tasks Configuration
Create `.vscode/tasks.json` in your project root:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🚀 Start QTools (Full Stack)",
      "type": "shell",
      "command": "npm",
      "args": ["start"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new",
        "showReuseMessage": true,
        "clear": false
      },
      "problemMatcher": []
    },
    {
      "label": "🔧 Start Backend Only",
      "type": "shell",
      "command": "npm",
      "args": ["run", "server"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "🎨 Start Frontend Only",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "🔒 Setup SSL Certificates",
      "type": "shell",
      "command": "npm",
      "args": ["run", "setup-certs"],
      "group": "build"
    },
    {
      "label": "🏗️ Build for Production",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build"
    }
  ]
}
```

### Launch Configuration
Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "🐛 Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Workspace Settings
Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 🖥️ Running QTools in VS Code

### Method 1: Using VS Code Tasks (Recommended)
1. **Open Command Palette**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. **Type**: `Tasks: Run Task`
3. **Select**: `🚀 Start QTools (Full Stack)`

### Method 2: Using Integrated Terminal
1. **Open Terminal**: `Ctrl+` ` or `View > Terminal`
2. **Run**: `npm start`

### Method 3: Using NPM Scripts Panel
1. **Open Explorer**: `Ctrl+Shift+E`
2. **Find NPM Scripts** section
3. **Click play button** next to `start`

---

## 🌐 Network Access Setup

### Find Your IP Address
**Windows (PowerShell):**
```powershell
ipconfig | findstr IPv4
```

**macOS/Linux:**
```bash
ifconfig | grep inet
```

### Access URLs
- **Local**: `https://localhost:8082`
- **Network**: `https://[YOUR-IP]:8082`
- **API**: `https://[YOUR-IP]:3000`

---

## 🔧 Development Workflow

### 1. Daily Development
```bash
# Start both servers
npm start

# Or use VS Code task: Ctrl+Shift+P > Tasks: Run Task > Start QTools
```

### 2. Backend Only Development
```bash
npm run server
```

### 3. Frontend Only Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
npm run start:prod
```

---

## 📱 Multi-Device Testing

### Setup Process
1. **Ensure both devices on same WiFi network**
2. **Start QTools**: `npm start`
3. **Note your IP address** from server output
4. **Access from other devices**: `https://[YOUR-IP]:8082`

### Troubleshooting Network Access
- **Firewall**: Allow ports 3000 and 8082
- **Certificate Warning**: Click "Advanced" → "Proceed to site"
- **Network Issues**: Check WiFi connection and IP address

---

## 🐛 Debugging in VS Code

### Backend Debugging
1. **Set breakpoints** in server files
2. **Press F5** or use Debug panel
3. **Select**: `🐛 Debug Backend`

### Frontend Debugging
1. **Install browser extension** (React Developer Tools)
2. **Use browser DevTools** for frontend debugging
3. **VS Code debugger** works with Chrome extension

---

## 📊 VS Code Extensions for QTools

### Essential Extensions
```bash
# Install via VS Code Extensions panel or command line:
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
```

### Recommended Extensions
- **Thunder Client** - API testing
- **SQLite Viewer** - Database inspection
- **GitLens** - Git integration
- **Auto Rename Tag** - HTML/JSX editing
- **Bracket Pair Colorizer** - Code readability

---

## 🔄 Git Integration in VS Code

### Source Control Panel
- **View changes**: `Ctrl+Shift+G`
- **Stage files**: Click `+` next to files
- **Commit**: Enter message and `Ctrl+Enter`
- **Push**: Click `...` → `Push`

### Quick Commit & Push
```bash
# Using integrated terminal
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 📋 Common VS Code Shortcuts

### Development
- **Open Terminal**: `Ctrl+` `
- **Command Palette**: `Ctrl+Shift+P`
- **Quick Open**: `Ctrl+P`
- **Go to Definition**: `F12`
- **Find in Files**: `Ctrl+Shift+F`

### Debugging
- **Start Debugging**: `F5`
- **Step Over**: `F10`
- **Step Into**: `F11`
- **Continue**: `F5`

---

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill processes on ports
npx kill-port 3000 8082
```

**SSL Certificate Issues:**
```bash
# Regenerate certificates
npm run setup-certs
```

**Dependencies Issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**VS Code Not Recognizing TypeScript:**
- **Reload Window**: `Ctrl+Shift+P` → `Developer: Reload Window`
- **Select TypeScript Version**: `Ctrl+Shift+P` → `TypeScript: Select TypeScript Version`

---

## 🎯 Production Deployment

### Build Process
```bash
npm run build
npm run start:prod
```

### Environment Variables
Create `.env.production`:
```env
VITE_API_URL=https://your-domain.com/api
NODE_ENV=production
```

---

## 📞 Support

### Getting Help
- **Check Console**: `F12` → Console tab
- **Check Network**: `F12` → Network tab
- **Check VS Code Problems**: `Ctrl+Shift+M`
- **Check Terminal Output**: Look for error messages

### Useful Commands
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test API connection
node test-api.js

# View running processes
netstat -an | findstr :3000
netstat -an | findstr :8082
```

---

**🎉 You're all set! QTools is now ready for development in Visual Studio Code with full network access and professional debugging capabilities.**