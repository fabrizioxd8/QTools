# QTools User Workflow & Experience Guide

This document outlines the step-by-step user experience (UX) movements for the core operations within QTools. It serves as a manual for users interacting with the system.

---

## 1. Checking Out Tools (Checkout Wizard)

**Scenario:** A worker needs to borrow tools for a specific project.

**UX Movements:**
1. **Navigate to Checkout:** Click on the **"Checkout"** link in the left sidebar or the "Checkout Tools" quick action on the Dashboard.
2. **Step 1: Select Tools**
   * *Action:* Use the search bar (Ctrl+F) to find tools by name or category.
   * *Action:* Click on the tool cards to select them. The card will highlight with a primary color ring.
   * *Action:* For bulk items, use the `+` and `-` buttons that appear on the card to adjust the required quantity.
   * *Action:* Click **Next**.
3. **Step 2: Select Worker**
   * *Action:* Search for the worker by name or Employee ID.
   * *Action:* Click the radio button or the worker's card to assign the tools to them.
   * *Action:* Click **Next**.
4. **Step 3: Select Project**
   * *Action:* Search for the target project.
   * *Action:* Select the project card.
   * *Action:* Click **Next**.
5. **Step 4: Review & Confirm**
   * *Action:* Review the summary of selected tools, worker, and project.
   * *Action:* (Optional) Adjust the checkout date and time if recording a past event.
   * *Action:* (Optional) Enter a "Número de guía" (Guide Number) and any relevant checkout notes.
   * *Action:* Click **Complete Checkout**.
6. **Result:** A success toast appears, and you are automatically redirected to the Active Assignments page.

---

## 2. Checking In Tools

**Scenario:** A worker is returning tools they previously checked out.

**UX Movements:**
1. **Navigate to Assignments:** Click on **"Assignments"** in the left sidebar.
2. **Locate Assignment:** Find the active assignment in the list. You can quickly spot overdue assignments by their red warning badges.
3. **Initiate Check-In:** Click the **"Check In"** button on the specific assignment card.
4. **Review Tool Conditions (Modal Dialog):**
   * *Action:* For each tool, you will see input fields for quantities under four categories: **Good**, **Missing**, **Damaged**, and **Lost**.
   * *Action:* By default, all tools are marked as "Good". If a tool is returned damaged or is missing, adjust the numbers accordingly (e.g., change Good to 0, and Damaged to 1).
   * *Validation:* The system ensures the total quantities match the number originally checked out. It will display a warning if the numbers don't add up.
5. **Finalize Details:**
   * *Action:* Confirm the Check-in Date and Time.
   * *Action:* Add any Check-in Notes (e.g., "Drill battery won't hold charge").
6. **Submit:** Click **Confirm Check-In**.
7. **Result:** A success toast appears. The assignment moves to the "Completed" tab, and the tool statuses are updated in the inventory (e.g., "Available", "Damaged", or "Lost").

---

## 3. Tool Creation & Management

**Scenario:** The tool room manager receives a new tool and needs to add it to the system.

**UX Movements:**
1. **Navigate to Tools:** Click on **"Tools Manager"** in the left sidebar.
2. **Initiate Creation:** Click the **"Add New Tool"** button in the top right.
3. **Basic Information (Modal Dialog):**
   * *Action:* Enter the **Tool Name** (e.g., "DeWalt Hammer Drill").
   * *Action:* Select a **Category** from the dropdown.
   * *Action:* Set the **Status** (default is Available).
   * *Action:* Set the **Quantity** (if bulk item).
4. **Calibration settings:**
   * *Action:* If the tool requires calibration, check the **"Requires Calibration"** box.
   * *Action:* Select the **Calibration Due Date** and input the **Certificate N°**.
5. **Custom Attributes (Optional):**
   * *Action:* Select an attribute type (Brand, Model, Serial Number) or choose "Custom".
   * *Action:* Enter the value (e.g., "DCD996B").
   * *Action:* Click the **`+`** button to add the attribute to the list. You can drag and drop to reorder these attributes.
6. **Image Upload:**
   * *Action:* In the right column, drag and drop an image file, click to browse, or paste an image URL to visually identify the tool.
7. **Submit:** Click **Add Tool**.
8. **Result:** The modal closes, a success toast appears, and the new tool is immediately visible in the grid/list.

---

## 4. Managing Workers & Projects

**Scenario:** Adding a new hire to the system so they can check out tools.

**UX Movements:**
1. **Navigate to Workers & Projects:** Click on **"Workers & Projects"** in the left sidebar.
2. **Initiate Creation:** Make sure you are on the "Workers" tab, then click **"Add Worker"**.
3. **Enter Details (Modal Dialog):**
   * *Action:* Enter the **Worker Name**.
   * *Action:* Enter their unique **Employee ID**.
4. **Submit:** Click **Add Worker**.
5. **Projects:** The process is identical for projects—switch to the "Projects" tab, click "Add Project", enter the name, and save.

---

## 5. Generating & Exporting Reports

**Scenario:** A supervisor needs to review tool activity for the past 30 days and share it with management.

**UX Movements:**
1. **Navigate to Reports:** Click on **"Reports"** in the left sidebar.
2. **Adjust Filters:**
   * *Action:* Click **"Advanced Filters"** to expand the date range options.
   * *Action:* Select "Last 30 days" from the preset dropdown, or choose custom Start and End dates.
   * *Result:* The charts, summary cards, and activity log table instantly update to reflect the chosen timeframe.
3. **Exporting Data:**
   * *Action:* Click **"Export Options"** in the top right.
   * *Action:* Select **"Export PDF"** to generate a formatted visual report for printing or emailing.
   * *Action:* Alternatively, to export the raw inventory data to Excel, navigate to the **Tools Manager** and click **"Export to Excel"**.

---
*Tip: Use the `Ctrl+F` shortcut anywhere in the app to instantly focus the main search bar for the page you are on.*