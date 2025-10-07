# QTools - Professional Tool Room Management System

<p align="center">
  <img src="public/logo.png" alt="QTools Logo" width="150"/>
</p>

<p align="center">
  <strong>Streamline your tool room operations with real-time tracking, automated workflows, and comprehensive reporting.</strong>
</p>

---

## 🎯 Executive Summary

QTools is a **production-ready tool inventory management system** designed to eliminate tool loss, reduce downtime, and improve operational efficiency in industrial environments. Built with modern web technologies, it provides real-time visibility into tool locations, usage patterns, and maintenance schedules.

### 💼 Business Value
- **📉 Reduce Tool Loss:** Track every tool from checkout to return
- **⏱️ Minimize Downtime:** Instant visibility of tool availability and location
- **📊 Data-Driven Decisions:** Comprehensive reporting and analytics
- **🔄 Streamlined Workflows:** Automated checkout/check-in processes
- **📱 Multi-Device Access:** Works on phones, tablets, and computers
- **🔒 Secure & Reliable:** Local network deployment with HTTPS encryption

---

## ✨ Core Features

### 🏠 **Real-Time Dashboard**
- Instant overview of tool inventory status
- Calibration alerts and maintenance reminders
- Key performance metrics and trends
- Quick access to critical operations

### 🔧 **Complete Tool Management**
- Digital tool catalog with photos and specifications
- **Flexible View Options:** Switch between grid and list views with customizable column density (2, 3, or 4 columns)
- **Advanced Sorting:** Click table headers to sort by name, category, or status with visual feedback
- Custom attributes for detailed tracking (serial numbers, purchase dates, etc.)
- Status tracking (Available, In Use, Damaged, Lost, Calibration Due)
- Maintenance and calibration scheduling

### 👥 **Workforce & Project Integration**
- Worker profiles with assignment history and generic user icons for visual consistency
- Project-based tool allocation with folder icons for easy identification
- **Intuitive Table Sorting:** Click column headers to sort workers and projects
- Performance tracking and accountability
- Workload distribution analysis

### 📋 **Smart Checkout System**
- 4-step guided checkout process
- Barcode/QR code ready (future enhancement)
- Automatic status updates
- Error prevention and validation

### 📊 **Advanced Reporting**
- Activity logs and audit trails
- Inventory status by category
- Usage patterns and trends
- Export capabilities for external analysis
- Calibration and maintenance reports

### 🌐 **Network-Ready Architecture**
- Access from any device on your network
- Real-time synchronization across all users
- Secure HTTPS communication
- Offline-capable with automatic sync

---

## 🚀 Quick Start Guide

### For IT/Setup Personnel

1. **Install Prerequisites:**
   - Download and install [Node.js](https://nodejs.org/) (v18 or later)

2. **Setup Application:**
   ```bash
   # Clone and setup
   git clone <repository-url>
   cd QTools
   npm install
   
   # Setup SSL certificates (one-time)
   npm run setup-certs
   
   # Start the system
   npm start
   ```

3. **Network Access:**
   - **Local:** `https://localhost:8082`
   - **Network:** `https://[server-ip]:8082`
   - Share the network URL with all users

### For End Users
- Simply navigate to the provided URL on any device
- No installation required - works in any modern web browser
- Accept the security certificate when prompted (one-time)

---

## 📱 Multi-Device Support

QTools works seamlessly across all devices:

- **🖥️ Desktop Computers:** Full feature access with large screen optimization
- **📱 Mobile Phones:** Touch-optimized interface for field use
- **📟 Tablets:** Perfect for tool room kiosks and mobile workstations
- **💻 Laptops:** Ideal for supervisors and managers

---

## 🔐 Security & Reliability

- **🔒 HTTPS Encryption:** All data transmission is encrypted
- **🏠 Local Network Only:** No internet connection required
- **💾 Automatic Backups:** Database automatically saves all changes
- **🔄 Real-Time Sync:** All devices see updates immediately
- **📊 Audit Trail:** Complete history of all actions

---

## 📈 Implementation Roadmap

### ✅ **Phase 1: Core System (Current)**
- Tool inventory management
- Worker and project tracking
- Basic checkout/check-in workflow
- Reporting and analytics
- Multi-device access

### 🔄 **Phase 2: Enhanced Features (Planned)**
- User authentication and role-based permissions
- Barcode/QR code scanning
- Advanced reporting and dashboards
- Mobile app development
- Integration with existing systems

### 🚀 **Phase 3: Enterprise Features (Future)**
- Cloud deployment options
- API integrations
- Advanced analytics and AI insights
- Maintenance scheduling automation
- Supply chain integration

---

## 💡 Why QTools?

### **Current Challenges Solved:**
- ❌ **Tool Loss:** "Where is that expensive torque wrench?"
- ❌ **Downtime:** "Who has the multimeter I need?"
- ❌ **Paperwork:** Manual logs and spreadsheets
- ❌ **Accountability:** "Who was the last person to use this?"
- ❌ **Maintenance:** Missed calibration dates

### **QTools Solutions:**
- ✅ **Real-Time Tracking:** Know exactly where every tool is
- ✅ **Instant Availability:** See what's available before walking to the tool room
- ✅ **Digital Records:** Automatic logging and history
- ✅ **Full Accountability:** Complete audit trail of all activities
- ✅ **Proactive Maintenance:** Automated calibration reminders

---

## 📞 Support & Training

- **📖 User Guide:** Comprehensive guide for daily operations
- **🎥 Training Materials:** Step-by-step tutorials (coming soon)
- **🔧 Technical Support:** IT deployment and troubleshooting guide
- **📊 Best Practices:** Recommended workflows and procedures

---

## 🎯 Next Steps

1. **Review the system** with your team
2. **Schedule a demonstration** for key stakeholders
3. **Plan the deployment** timeline
4. **Identify pilot users** for initial rollout
5. **Prepare training materials** for your specific workflows

---

**QTools transforms your tool room from a cost center into a strategic asset, providing the visibility and control needed for modern industrial operations.**