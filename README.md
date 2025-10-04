# QTools - Tool Room Inventory Management System

<p align="center">
  <img src="public/logo.png" alt="QTools Logo" width="150"/>
</p>

<p align="center">
  A complete, modern, and user-friendly tool inventory management system designed to track tools, workers, projects, and assignments with a seamless checkout/check-in workflow.
</p>

---

## ✨ Key Features

- ✅ **Real-time Dashboard:** Get an instant overview of your entire operation with key metrics, calibration alerts, and status summaries.
- ✅ **Comprehensive Tool Management:** Full CRUD (Create, Read, Update, Delete) functionality for your tool inventory, complete with image uploads and custom attributes for detailed tracking.
- ✅ **Worker & Project Tracking:** A clean, tabbed interface to manage your workforce and active projects.
- ✅ **Guided Checkout Wizard:** A simple 4-step process to ensure tools are checked out to the correct worker and project quickly and without errors.
- ✅ **Assignment History:** Easily track all active and completed assignments, including tool conditions upon check-in.
- ✅ **Powerful Reporting:** View detailed activity logs, analyze inventory status by category, and export your data to CSV for further analysis.
- ✅ **Persistent Local Server:** All your data is stored in a local database, ensuring it's saved and shared across all devices on your network.
- ✅ **Secure Local Environment:** Runs on HTTPS locally to ensure a secure and modern development environment.
- ✅ **Fully Responsive Design:** A clean, professional interface that works beautifully on desktop, tablets, and mobile devices.

---

## 🛠️ Technology Stack

- **Frontend:**
  - **Framework:** React 18 + TypeScript
  - **Build Tool:** Vite
  - **Styling:** Tailwind CSS
  - **UI Components:** Shadcn/UI
  - **Routing:** React Router DOM v6
  - **State Management:** React Context API
- **Backend:**
  - **Framework:** Node.js + Express.js
  - **Database:** SQLite (File-based)
- **Development:**
  - **HTTPS:** `@vitejs/plugin-basic-ssl` for the frontend and `pem` for the backend.

---

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/fabrizioxd8/QTools.git
    cd QTools
    ```

2.  **Install dependencies:**
    This single command will install all the necessary packages for both the frontend and the backend server.
    ```bash
    npm install
    ```

3.  **Set up the environment file:**
    The frontend needs to know the URL of the backend API. Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    *You can modify the `.env` file later if your server runs on a different address, but the default setup should work out of thethe box.*

### Running the Application

The application consists of two parts: the **backend server** and the **frontend server**. You will need to **open two separate terminal windows** to run them at the same time.

**1. Start the Backend Server:**

- In your first terminal window, run the following command:
  ```bash
  npm run server
  ```
- You should see the output `Secure server is running on https://localhost:3000`. Leave this terminal running.

**2. Start the Frontend Server:**

- In your second terminal window, run the following command:
  ```bash
  npm run dev
  ```
- This will start the Vite development server, typically at `https://localhost:8080`.

**3. Access the Application:**

- Open your web browser and navigate to the frontend URL (e.g., `https://localhost:8080`).

> **Note on HTTPS:** The first time you access the `https://` URLs, your browser will show a security warning. This is expected because the SSL certificates are self-signed for local development. It is safe to click **"Advanced"** and **"Proceed to localhost"** to continue.