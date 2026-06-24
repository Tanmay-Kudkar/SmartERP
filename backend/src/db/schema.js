const pool = require('./pool');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        gst_number VARCHAR(20),
        pan_number VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        financial_year_start DATE DEFAULT '2024-04-01',
        financial_year_end DATE DEFAULT '2025-03-31',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ledger Groups
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledger_groups (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES ledger_groups(id),
        nature VARCHAR(50) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ledgers
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledgers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES ledger_groups(id),
        name VARCHAR(255) NOT NULL,
        ledger_type VARCHAR(50) NOT NULL,
        opening_balance DECIMAL(15,2) DEFAULT 0,
        balance_type VARCHAR(10) DEFAULT 'Dr',
        gst_number VARCHAR(20),
        pan_number VARCHAR(20),
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        state VARCHAR(100),
        city VARCHAR(100),
        pincode VARCHAR(10),
        credit_limit DECIMAL(15,2) DEFAULT 0,
        credit_days INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Units of Measure
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Groups
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_groups (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES stock_groups(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Stock Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        stock_group_id INTEGER REFERENCES stock_groups(id),
        unit_id INTEGER REFERENCES units(id),
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        description TEXT,
        purchase_price DECIMAL(15,2) DEFAULT 0,
        selling_price DECIMAL(15,2) DEFAULT 0,
        mrp DECIMAL(15,2) DEFAULT 0,
        gst_percentage DECIMAL(5,2) DEFAULT 0,
        hsn_code VARCHAR(20),
        opening_stock DECIMAL(15,3) DEFAULT 0,
        current_stock DECIMAL(15,3) DEFAULT 0,
        reorder_level DECIMAL(15,3) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Vouchers (Sales, Purchase, Receipt, Payment, Journal, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        voucher_type VARCHAR(50) NOT NULL,
        voucher_number VARCHAR(100) NOT NULL,
        voucher_date DATE NOT NULL,
        ledger_id INTEGER REFERENCES ledgers(id),
        narration TEXT,
        subtotal DECIMAL(15,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        taxable_amount DECIMAL(15,2) DEFAULT 0,
        cgst_amount DECIMAL(15,2) DEFAULT 0,
        sgst_amount DECIMAL(15,2) DEFAULT 0,
        igst_amount DECIMAL(15,2) DEFAULT 0,
        total_gst DECIMAL(15,2) DEFAULT 0,
        grand_total DECIMAL(15,2) DEFAULT 0,
        paid_amount DECIMAL(15,2) DEFAULT 0,
        balance_amount DECIMAL(15,2) DEFAULT 0,
        payment_mode VARCHAR(50) DEFAULT 'credit',
        is_interstate BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Voucher Items (line items)
    await client.query(`
      CREATE TABLE IF NOT EXISTS voucher_items (
        id SERIAL PRIMARY KEY,
        voucher_id INTEGER REFERENCES vouchers(id) ON DELETE CASCADE,
        stock_item_id INTEGER REFERENCES stock_items(id),
        item_name VARCHAR(255),
        hsn_code VARCHAR(20),
        quantity DECIMAL(15,3) NOT NULL,
        unit_id INTEGER REFERENCES units(id),
        rate DECIMAL(15,2) NOT NULL,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        taxable_amount DECIMAL(15,2) NOT NULL,
        gst_percentage DECIMAL(5,2) DEFAULT 0,
        cgst_percent DECIMAL(5,2) DEFAULT 0,
        cgst_amount DECIMAL(15,2) DEFAULT 0,
        sgst_percent DECIMAL(5,2) DEFAULT 0,
        sgst_amount DECIMAL(15,2) DEFAULT 0,
        igst_percent DECIMAL(5,2) DEFAULT 0,
        igst_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inventory Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        stock_item_id INTEGER REFERENCES stock_items(id),
        voucher_id INTEGER REFERENCES vouchers(id),
        transaction_type VARCHAR(20) NOT NULL,
        quantity DECIMAL(15,3) NOT NULL,
        rate DECIMAL(15,2) NOT NULL,
        transaction_date DATE NOT NULL,
        narration TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ledger Transactions (double-entry ledger)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ledger_transactions (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        ledger_id INTEGER REFERENCES ledgers(id),
        voucher_id INTEGER REFERENCES vouchers(id),
        transaction_date DATE NOT NULL,
        debit_amount DECIMAL(15,2) DEFAULT 0,
        credit_amount DECIMAL(15,2) DEFAULT 0,
        narration TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = createTables;
