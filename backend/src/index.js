require('dotenv').config();
const express = require('express');
const cors = require('cors');
const createTables = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/ledgers', require('./routes/ledgers'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/vouchers', require('./routes/vouchers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartERP API is running', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Start server
const start = async () => {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`🚀 SmartERP API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
