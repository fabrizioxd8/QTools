# QTools - VSCode Development Setup Guide

This guide will help you set up the QTools project in VSCode on any PC for continued development.

## 📋 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **VSCode**
   - Download from: https://code.visualstudio.com/
   - Install recommended extensions (see below)

### Recommended VSCode Extensions
Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one"
  ]
}
```

## 🚀 Project Setup

### 1. Clone the Repository
```bash
# Clone the project
git clone https://github.com/fabrizioxd8/QTools.git
cd QTools

# Or if you have SSH set up
git clone git@github.com:fabrizioxd8/QTools.git
cd QTools
```

### 2. Install Dependencies
```bash
# Install all project dependencies
npm install

# This will install:
# - React + TypeScript
# - Vite (build tool)
# - Tailwind CSS
# - Shadcn/ui components
# - All other dependencies
```

### 3. Environment Setup
```bash
# Copy environment template (if exists)
cp .env.example .env

# Or create .env file with necessary variables
# (Currently the project runs without additional env vars)
```

### 4. Database Setup
```bash
# Run database migration to create tables
npm run migrate

# This creates qtools.db with sample data
```

### 5. SSL Certificates (for HTTPS)
```bash
# Generate SSL certificates for local development
npm run setup-certs

# This creates certificates in server/certs/
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)
```bash
# Start both frontend and backend
npm start

# Or run them separately:
# Terminal 1 - Backend API server
npm run server

# Terminal 2 - Frontend development server  
npm run dev
```

### Production Mode
```bash
# Build and run production version
npm run start:prod
```

### Available Scripts
```bash
npm run dev          # Start Vite dev server (frontend only)
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend API server
npm start            # Start both frontend and backend
npm run migrate      # Run database migrations
npm run setup-certs  # Generate SSL certificates
npm run lint         # Run ESLint
```

## 🌐 Access URLs

After starting the application:

- **Frontend**: https://localhost:8081 or https://localhost:8082
- **Backend API**: https://localhost:3000
- **Network Access**: https://[your-ip]:8081 (for mobile testing)

## 📁 Project Structure

```
QTools/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   │   └── ui/            # Shadcn/ui components
│   ├── contexts/          # React contexts (AppDataContext)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Main application pages
│   └── styles/            # CSS and styling
├── server/                # Backend API server
│   ├── routes/            # API route handlers
│   ├── certs/             # SSL certificates
│   └── uploads/           # File uploads
├── public/                # Static assets
├── scripts/               # Build and utility scripts
└── docs/                  # Documentation files
```

## 🔧 Development Workflow

### 1. Creating New Features
```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Make your changes
# Test thoroughly
# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to GitHub
git push -u origin feature/your-feature-name
```

### 2. Working with Components
- Components are in `src/components/`
- Use Shadcn/ui components from `src/components/ui/`
- Follow existing patterns for consistency

### 3. API Development
- Backend routes are in `server/routes/`
- Database operations use SQLite with helper functions
- API client is in `src/lib/api.ts`

### 4. Styling
- Uses Tailwind CSS for styling
- Custom components follow Shadcn/ui patterns
- Responsive design with mobile-first approach

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill processes on specific ports
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux  
lsof -ti:3000 | xargs kill -9
```

**SSL Certificate Issues**
```bash
# Regenerate certificates
npm run setup-certs

# Or accept browser security warnings for localhost
```

**Database Issues**
```bash
# Reset database
rm qtools.db
npm run migrate
```

**Node Modules Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### VSCode Configuration

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

Create `.vscode/launch.json` for debugging:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "https://localhost:8081",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

## 📚 Key Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Icons**: Lucide React
- **Routing**: Custom routing system (not React Router)

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation when needed
5. Create pull requests for review

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Look at existing issues in the GitHub repository
3. Create a new issue with detailed information
4. Include error messages and steps to reproduce

---

**Happy Coding! 🚀**