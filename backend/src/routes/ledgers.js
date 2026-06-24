const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware: check company belongs to user
const checkCompany = async (req, res, next) => {
  const companyId = req.headers['x-company-id'];
  if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required in x-company-id header.' });
  const result = await pool.query('SELECT id FROM companies WHERE id = $1 AND user_id = $2', [companyId, req.user.id]);
  if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied to this company.' });
  req.companyId = parseInt(companyId);
  next();
};

// GET /api/ledgers/groups
router.get('/groups', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ledger_groups WHERE company_id = $1 ORDER BY name',
      [req.companyId]
    );
    res.json({ success: true, groups: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/ledgers
router.get('/', auth, checkCompany, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = `
      SELECT l.*, g.name as group_name 
      FROM ledgers l
      LEFT JOIN ledger_groups g ON l.group_id = g.id
      WHERE l.company_id = $1
    `;
    const params = [req.companyId];
    if (type) { params.push(type); query += ` AND l.ledger_type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND l.name ILIKE $${params.length}`; }
    query += ' ORDER BY l.name';
    const result = await pool.query(query, params);
    res.json({ success: true, ledgers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/ledgers
router.post('/', auth, checkCompany, async (req, res) => {
  try {
    const { group_id, name, ledger_type, opening_balance, balance_type, gst_number, pan_number, address, phone, email, state, city, pincode, credit_limit, credit_days } = req.body;
    if (!name || !ledger_type) return res.status(400).json({ success: false, message: 'Name and ledger type required.' });
    const result = await pool.query(
      `INSERT INTO ledgers (company_id, group_id, name, ledger_type, opening_balance, balance_type, gst_number, pan_number, address, phone, email, state, city, pincode, credit_limit, credit_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [req.companyId, group_id, name, ledger_type, opening_balance || 0, balance_type || 'Dr', gst_number, pan_number, address, phone, email, state, city, pincode, credit_limit || 0, credit_days || 0]
    );
    res.status(201).json({ success: true, ledger: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/ledgers/:id
router.get('/:id', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT l.*, g.name as group_name FROM ledgers l LEFT JOIN ledger_groups g ON l.group_id = g.id WHERE l.id = $1 AND l.company_id = $2',
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Ledger not found.' });
    res.json({ success: true, ledger: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/ledgers/:id/transactions
router.get('/:id/transactions', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lt.*, v.voucher_number, v.voucher_type, v.voucher_date
       FROM ledger_transactions lt
       JOIN vouchers v ON lt.voucher_id = v.id
       WHERE lt.ledger_id = $1 AND lt.company_id = $2
       ORDER BY lt.transaction_date DESC, lt.id DESC`,
      [req.params.id, req.companyId]
    );
    res.json({ success: true, transactions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/ledgers/:id
router.put('/:id', auth, checkCompany, async (req, res) => {
  try {
    const { group_id, name, ledger_type, opening_balance, balance_type, gst_number, pan_number, address, phone, email, state, city, pincode, credit_limit, credit_days, is_active } = req.body;
    const result = await pool.query(
      `UPDATE ledgers SET group_id=$1, name=$2, ledger_type=$3, opening_balance=$4, balance_type=$5, gst_number=$6, pan_number=$7, address=$8, phone=$9, email=$10, state=$11, city=$12, pincode=$13, credit_limit=$14, credit_days=$15, is_active=$16, updated_at=NOW()
       WHERE id=$17 AND company_id=$18 RETURNING *`,
      [group_id, name, ledger_type, opening_balance || 0, balance_type || 'Dr', gst_number, pan_number, address, phone, email, state, city, pincode, credit_limit || 0, credit_days || 0, is_active !== false, req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Ledger not found.' });
    res.json({ success: true, ledger: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/ledgers/:id
router.delete('/:id', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ledgers WHERE id=$1 AND company_id=$2 RETURNING id', [req.params.id, req.companyId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Ledger not found.' });
    res.json({ success: true, message: 'Ledger deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
