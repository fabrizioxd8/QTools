# QTools Changelog

## Version 2.1.0 - Enhanced User Experience (Latest)

### 🎨 New Features
- **User-Configurable Tool Layouts**: Switch between grid and list views with customizable column density (2, 3, or 4 columns)
- **Visual Sort Feedback**: Dynamic sort icons that cycle through unsorted (↕️), ascending (▲), and descending (▼) states
- **Table Header Sorting**: Click column headers in Workers & Projects tables for intuitive sorting
- **Generic UI Icons**: Consistent user icons for workers and folder icons for projects

### 🐛 Critical Bug Fixes
- **Checkout Page Loading**: Fixed React Router navigation issues causing blank checkout page
- **Database Schema**: Added missing `updated_at` columns to workers, projects, and tools tables
- **Edit Functionality**: Fixed missing Edit icon import in WorkersProjects page
- **Tool Image Upload**: Enhanced file upload system with proper server-side handling
- **Bottom Navigation**: Improved visual connection between checkout wizard content and navigation bar

### 🔧 Technical Improvements
- Enhanced API client with FormData support for file uploads
- Improved loading states and error handling
- Better responsive design for mobile devices
- Optimized database operations with proper schema migrations

## Previous Updates

### Enhanced Commit Script
- Added intelligent commit message generation
- Analyzes changed files to suggest appropriate messages
- Interactive prompts for user confirmation
- Supports custom commit messages

### Smart Features
- Detects file types (backend, frontend, docs, config)
- Generates contextual emojis and descriptions
- Shows changed files before committing
- Provides fallback manual instructions