# SmartERP – Billing, Inventory & Accounting Management System

> A Tally-inspired web ERP built with React + Vite + Express + PostgreSQL

## MVP Features
- ✅ **Authentication** – Register/Login with JWT
- ✅ **Company Management** – Up to 5 companies per account
- ✅ **Ledger Masters** – Customer, Supplier, Expense, Income, Bank, Cash
- ✅ **Stock Items** – With GST%, HSN code, SKU, pricing, reorder levels
- ✅ **Units of Measure** – PCS, KG, BOX, LTR, etc.
- ✅ **Sales Voucher** (F8) – Customer bill with CGST/SGST/IGST, inventory auto-decreases
- ✅ **Purchase Voucher** (F9) – Supplier purchase, inventory auto-increases
- ✅ **GST Invoice** – Printable A4 invoice with amount in words
- ✅ **Keyboard Shortcuts** – Full Tally-inspired navigation

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | Company Selection |
| F8 | New Sales Voucher |
| F9 | New Purchase Voucher |
| Alt+L | Create Ledger |
| Alt+A | Ledger List |
| Alt+S | Create Stock Item |
| Alt+U | Unit Creation |
| Ctrl+I | Inventory |
| Ctrl+N | New Item |
| Ctrl+B | New Invoice |
| Ctrl+H | Home/Dashboard |
| Ctrl+Q | Logout |
| Esc | Go Back |

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup
```sql
CREATE DATABASE smarterp;
```

### 2. Backend Setup
```bash
cd backend
npm install
# Edit .env with your DB credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### .env (backend)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smarterp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| State | Zustand |
| Forms | React Hook Form |
| HTTP | Axios |
| Backend | Express.js |
| Database | PostgreSQL |
| Auth | JWT (bcryptjs) |

## Project Structure

```
SmartERP/
├── frontend/
│   └── src/
│       ├── api/          # Axios client
│       ├── components/   # AppLayout, Sidebar
│       ├── hooks/        # useKeyboardShortcuts
│       ├── pages/
│       │   ├── masters/  # Ledger, Stock, Units
│       │   └── vouchers/ # Sales, Purchase, Invoice
│       └── store/        # Zustand store
└── backend/
    └── src/
        ├── db/           # Pool, Schema, Seed
        ├── middleware/   # JWT Auth
        └── routes/       # auth, companies, ledgers, stock, vouchers
```
