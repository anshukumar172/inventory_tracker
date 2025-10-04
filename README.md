# 📦 Inventory Tracker with Multi-Warehouse

A lightweight and fast inventory management system that helps businesses manage **multi-warehouse stock**, track movements, generate **GST-compliant invoices**, and provide **real-time reports**. Built with **React (frontend)**, **Node.js/Express (backend)**, and **MySQL (database)**.

---

## 🚀 Features

* 🏬 **Multi-Warehouse Management** – Add/manage warehouses and track stock per location.
* 📊 **Stock Tracking** – Record stock in/out movements with batch, expiry, and pricing.
* 💰 **Total Stock Value Calculation** – Real-time valuation of inventory.
* 🧾 **Invoice & Billing** – Generate invoices with GST compliance.
* 🔔 **Low Stock Alerts** – Automatic notifications when stock is below threshold.
* 📈 **Reports** – Stock summary, movement history, invoice history.
* 🔐 **Role-Based Access** – Admin, Accountant, and Warehouse User.

---

## 🏗️ Tech Stack

* **Frontend**: React, TailwindCSS / Material UI
* **Backend**: Node.js, Express.js
* **Database**: MySQL
* **Authentication**: JWT (JSON Web Tokens)
* **Deployment**: Docker / Local server

---

## 📂 Project Structure

```
inventory_tracker/
│── backend/        # Node.js + Express backend
│   ├── routes/     # API routes
│   ├── models/     # Database models
│   ├── config/     # DB config & env
│── frontend/       # React frontend
│   ├── src/
│   ├── components/ # UI components
│── database/       # SQL schema & seed data
│── README.md
```

---

## ⚡ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/anshukumar172/inventory_tracker.git
cd inventory_tracker
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
npm run dev
```

* Create a `.env` file inside `backend/` with:

  ```
  PORT=8000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=inventory_db
  JWT_SECRET=your_jwt_secret
  ```

### 3️⃣ Setup Frontend

```bash
cd ../frontend
npm install
npm start
```

Frontend will run on **[http://localhost:3000](http://localhost:3000)**.

---

## 🗄️ Database Setup

* Import `database/schema.sql` into MySQL.
* Seed sample data using `database/seed.sql`.

---

## 📡 API Endpoints

### Warehouses

* `GET /api/warehouses` → Get all warehouses
* `POST /api/warehouses` → Add a warehouse

### Products

* `GET /api/products` → Get products list
* `POST /api/products` → Add a product

### Stock

* `GET /api/stock/value` → Get total stock value
* `POST /api/stock/move` → Record stock movement

### Invoices

* `POST /api/invoices` → Generate invoice
* `GET /api/invoices/:id` → Get invoice details

---

## 📸 Screenshots (Optional)

*(Add screenshots of your UI here – Dashboard, Warehouses, Invoices)*

---

## 👨‍💻 Author

**Anshu Kumar**

* B.Tech CSE (Data Science), NIET
* [GitHub](https://github.com/anshukumar172)

---

## 🛠️ Future Enhancements

* 📲 Mobile App (React Native)
* 🔄 Barcode/QR Code stock scanning
* ☁️ Cloud deployment with CI/CD
* 📑 Export reports to Excel/PDF

---
