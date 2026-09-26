# Full-Stack Expense Tracker System

A production-style, responsive, secure full-stack web application for personal expense tracking built with **Node.js**, **Express.js**, **MongoDB with Mongoose**, **JWT Authentication**, and modern **Vanilla HTML5, CSS3, and JavaScript** using the browser **Fetch API**.

---

## 🌟 Key Features

* **Authentication & Authorization**:
  * User Registration with password hashing using `bcryptjs`.
  * User Login returning signed JWT (JSON Web Tokens).
  * Strict JWT auth middleware protecting API endpoints.
  * Multi-tenant data isolation — users can only access, modify, or delete their own expense records.
* **Expense Management (CRUD)**:
  * Add expenses with Title, Amount, Category, Description, and Date.
  * View expense list with formatted currency and date badges.
  * Edit expense details via interactive modal dialogs.
  * Delete expenses with user confirmation dialog.
* **Filtering & Search**:
  * Real-time text search across expense title and description.
  * Category dropdown filter (Food, Transport, Shopping, Bills, Entertainment, Health, Education, Other).
  * Date range filter (`startDate` and `endDate`).
  * Flexible sorting (Date ascending/descending, Amount ascending/descending).
* **Financial Analytics & Summary Dashboard**:
  * Total Expenditure metric card.
  * Total Count of expense transactions.
  * Current Month Spending calculation.
  * Highest single expense tracker.
  * Category distribution percentage breakdown bars.
* **Modern UX/UI Aesthetics**:
  * Dark Mode Glassmorphic UI design system.
  * Fully responsive mobile-friendly layout.
  * Toast notifications for success, error, and network states.
  * Dynamic DOM updates without page reloads.

---

## 🛠 Tech Stack

* **Frontend**: HTML5, CSS3 (Vanilla Glassmorphism Design System), Vanilla JavaScript (ES6+), Fetch API
* **Backend**: Node.js, Express.js
* **Database**: MongoDB with Mongoose ORM (Includes automatic fallback to `mongodb-memory-server` for zero-config execution)
* **Security & Auth**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing, CORS
* **Environment**: `dotenv`

---

## 📁 Project Structure

```text
expense-tracker/
│
├── server.js                 # Entry point, Express app setup, static hosting
├── package.json              # Project dependencies and scripts
├── .env                      # Environment variables (PORT, MONGO_URI, JWT_SECRET, etc.)
├── .env.example              # Sample environment variables template
├── .gitignore
│
├── config/
│   └── db.js                 # MongoDB connection logic with robust memory-server fallback
│
├── models/
│   ├── User.js               # Mongoose User schema with bcrypt password hashing
│   └── Expense.js            # Mongoose Expense schema with category validation
│
├── controllers/
│   ├── authController.js     # User registration, login, and profile controllers
│   └── expenseController.js  # Expense CRUD, query filters, and summary metrics controllers
│
├── middleware/
│   ├── authMiddleware.js     # JWT verification & user context attachment
│   └── errorHandler.js       # Centralized error handler returning standardized JSON
│
├── routes/
│   ├── authRoutes.js         # Routes for /api/auth
│   └── expenseRoutes.js      # Routes for /api/expenses
│
├── public/                   # Static frontend assets
│   ├── index.html            # Auth routing / landing page
│   ├── login.html            # User login page
│   ├── register.html         # User registration page
│   ├── dashboard.html        # Main Expense Tracker dashboard
│   ├── css/
│   │   └── style.css         # Glassmorphism dark/light design system
│   └── js/
│       ├── api.js            # Centralized Fetch API client wrapper & toast notifications
│       ├── auth.js           # Auth forms, session storage & redirects
│       └── dashboard.js      # Dynamic UI updates, filtering, CRUD & metrics
│
└── README.md                 # Complete documentation
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
* Node.js (v16+ recommended)
* MongoDB (Optional: local MongoDB server or MongoDB Atlas. If no MongoDB server is active, the app automatically initializes an in-memory database server).

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory (or copy `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=super_secret_jwt_key_expense_tracker_2026_xyz
JWT_EXPIRES_IN=1d
```

### 4. Run the Application

```bash
npm start
```

Open your browser and navigate to: **`http://localhost:5000`**

---

## 🔐 How JWT Authentication Works

1. **Registration/Login**: When a user registers or logs in via `/api/auth/register` or `/api/auth/login`, the server generates a signed JSON Web Token (JWT) containing the user's MongoDB `_id`.
2. **Client Storage**: The frontend receives the token and stores it in `localStorage`.
3. **Protected Requests**: Every subsequent API call executed by `api.js` attaches the header:
   ```http
   Authorization: Bearer <your_jwt_token>
   ```
4. **Middleware Verification**: The backend `authMiddleware.js` extracts and verifies the token using `JWT_SECRET`, decodes `req.user.id`, and ensures protected expense routes only query records belonging to `req.user.id`.

---

## 📡 REST API Documentation

### Authentication Endpoints

#### 1. Register User
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "Anushka",
    "email": "anushka@example.com",
    "password": "password123"
  }
  ```
* **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "_id": "66f4ab...",
        "name": "Anushka",
        "email": "anushka@example.com"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### 2. Login User
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "anushka@example.com",
    "password": "password123"
  }
  ```
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "_id": "66f4ab...",
        "name": "Anushka",
        "email": "anushka@example.com"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

---

### Expense Endpoints (All Protected)

#### 3. Create Expense
* **Endpoint**: `POST /api/expenses`
* **Access**: Private (Requires JWT)
* **Request Body**:
  ```json
  {
    "title": "Lunch",
    "amount": 250,
    "category": "Food",
    "description": "Lunch with team",
    "date": "2026-09-25"
  }
  ```

#### 4. Get Expenses (With Filters & Sorting)
* **Endpoint**: `GET /api/expenses`
* **Access**: Private (Requires JWT)
* **Supported Query Parameters**:
  * `?category=Food`
  * `?search=Lunch`
  * `?startDate=2026-09-01&endDate=2026-09-30`
  * `?sortBy=date` or `?sortBy=amount`
  * `?order=desc` or `?order=asc`

#### 5. Get Summary Statistics
* **Endpoint**: `GET /api/expenses/summary`
* **Access**: Private (Requires JWT)
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalExpenses": 1250,
      "count": 5,
      "currentMonthSpending": 1250,
      "highestExpense": 500,
      "categoryBreakdown": {
        "Food": { "total": 250, "count": 1 },
        "Bills": { "total": 500, "count": 1 }
      }
    }
  }
  ```

#### 6. Get Single Expense
* **Endpoint**: `GET /api/expenses/:id`
* **Access**: Private (Requires JWT - Ownership enforced)

#### 7. Update Expense
* **Endpoint**: `PUT /api/expenses/:id`
* **Access**: Private (Requires JWT - Ownership enforced)

#### 8. Delete Expense
* **Endpoint**: `DELETE /api/expenses/:id`
* **Access**: Private (Requires JWT - Ownership enforced)

---

## 🧪 Testing Checklist

Execute the comprehensive integration test suite:

```bash
npm test
```

The test script automatically tests:
1. User Registration & Password Hashing.
2. User Login & Token Receipt.
3. Access rejection on protected endpoints without JWT.
4. Expense Creation for User A.
5. Expense Creation for User B.
6. Multi-user Data Isolation Verification (User B cannot access or modify User A's expense).
7. Filtering by Category, Search, Date Range, and Sorting.
8. Expense Update & Deletion.

---

## 💡 Assumptions & Future Enhancements

* **Currency**: Standard USD ($) formatting is applied by default in the frontend UI.
* **Future Improvements**:
  * Export expense reports to CSV/PDF.
  * Monthly budget target setting & alert notifications.
  * Recurring expense auto-creation.
