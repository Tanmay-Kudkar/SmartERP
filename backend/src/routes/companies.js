const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { seedDefaultGroups } = require('../db/seed');

const router = express.Router();

// GET /api/companies - list user's companies
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at ASC',
      [req.user.id]
    );
    res.json({ success: true, companies: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/companies - create company
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    const countResult = await client.query('SELECT COUNT(*) FROM companies WHERE user_id = $1', [req.user.id]);
    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 companies allowed per account.' });
    }
    const { name, address, city, state, pincode, gst_number, pan_number, phone, email, financial_year_start, financial_year_end } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Company name is required.' });

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO companies (user_id, name, address, city, state, pincode, gst_number, pan_number, phone, email, financial_year_start, financial_year_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.id, name, address, city, state, pincode, gst_number, pan_number, phone, email,
       financial_year_start || '2024-04-01', financial_year_end || '2025-03-31']
    );
    const company = result.rows[0];
    await seedDefaultGroups(company.id, client);
    await client.query('COMMIT');
    res.status(201).json({ success: true, company });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// GET /api/companies/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, company: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/companies/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, address, city, state, pincode, gst_number, pan_number, phone, email, financial_year_start, financial_year_end } = req.body;
    const result = await pool.query(
      `UPDATE companies SET name=$1, address=$2, city=$3, state=$4, pincode=$5, gst_number=$6, pan_number=$7, phone=$8, email=$9, financial_year_start=$10, financial_year_end=$11, updated_at=NOW()
       WHERE id=$12 AND user_id=$13 RETURNING *`,
      [name, address, city, state, pincode, gst_number, pan_number, phone, email, financial_year_start, financial_year_end, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, company: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM companies WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true, message: 'Company deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
