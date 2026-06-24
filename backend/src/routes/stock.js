const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

const checkCompany = async (req, res, next) => {
  const companyId = req.headers['x-company-id'];
  if (!companyId) return res.status(400).json({ success: false, message: 'Company ID required.' });
  const result = await pool.query('SELECT id FROM companies WHERE id = $1 AND user_id = $2', [companyId, req.user.id]);
  if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });
  req.companyId = parseInt(companyId);
  next();
};

// GET /api/stock/units
router.get('/units', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM units WHERE company_id = $1 ORDER BY symbol', [req.companyId]);
    res.json({ success: true, units: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/stock/units
router.post('/units', auth, checkCompany, async (req, res) => {
  try {
    const { name, symbol } = req.body;
    const result = await pool.query('INSERT INTO units (company_id, name, symbol) VALUES ($1,$2,$3) RETURNING *', [req.companyId, name, symbol]);
    res.status(201).json({ success: true, unit: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/stock/units/:id
router.delete('/units/:id', auth, checkCompany, async (req, res) => {
  try {
    await pool.query('DELETE FROM units WHERE id=$1 AND company_id=$2', [req.params.id, req.companyId]);
    res.json({ success: true, message: 'Unit deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/stock/groups
router.get('/groups', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stock_groups WHERE company_id = $1 ORDER BY name', [req.companyId]);
    res.json({ success: true, groups: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/stock/groups
router.post('/groups', auth, checkCompany, async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const result = await pool.query('INSERT INTO stock_groups (company_id, name, parent_id) VALUES ($1,$2,$3) RETURNING *', [req.companyId, name, parent_id]);
    res.status(201).json({ success: true, group: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/stock/items
router.get('/items', auth, checkCompany, async (req, res) => {
  try {
    const { search, group_id } = req.query;
    let query = `
      SELECT si.*, u.symbol as unit_symbol, u.name as unit_name, sg.name as group_name
      FROM stock_items si
      LEFT JOIN units u ON si.unit_id = u.id
      LEFT JOIN stock_groups sg ON si.stock_group_id = sg.id
      WHERE si.company_id = $1
    `;
    const params = [req.companyId];
    if (search) { params.push(`%${search}%`); query += ` AND si.name ILIKE $${params.length}`; }
    if (group_id) { params.push(group_id); query += ` AND si.stock_group_id = $${params.length}`; }
    query += ' ORDER BY si.name';
    const result = await pool.query(query, params);
    res.json({ success: true, items: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/stock/items
router.post('/items', auth, checkCompany, async (req, res) => {
  try {
    const { stock_group_id, unit_id, name, sku, description, purchase_price, selling_price, mrp, gst_percentage, hsn_code, opening_stock, reorder_level } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Item name required.' });
    const result = await pool.query(
      `INSERT INTO stock_items (company_id, stock_group_id, unit_id, name, sku, description, purchase_price, selling_price, mrp, gst_percentage, hsn_code, opening_stock, current_stock, reorder_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$13) RETURNING *`,
      [req.companyId, stock_group_id, unit_id, name, sku, description, purchase_price || 0, selling_price || 0, mrp || 0, gst_percentage || 0, hsn_code, opening_stock || 0, reorder_level || 0]
    );
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/stock/items/:id
router.get('/items/:id', auth, checkCompany, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT si.*, u.symbol as unit_symbol, u.name as unit_name FROM stock_items si LEFT JOIN units u ON si.unit_id = u.id WHERE si.id = $1 AND si.company_id = $2',
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/stock/items/:id
router.put('/items/:id', auth, checkCompany, async (req, res) => {
  try {
    const { stock_group_id, unit_id, name, sku, description, purchase_price, selling_price, mrp, gst_percentage, hsn_code, reorder_level, is_active } = req.body;
    const result = await pool.query(
      `UPDATE stock_items SET stock_group_id=$1, unit_id=$2, name=$3, sku=$4, description=$5, purchase_price=$6, selling_price=$7, mrp=$8, gst_percentage=$9, hsn_code=$10, reorder_level=$11, is_active=$12, updated_at=NOW()
       WHERE id=$13 AND company_id=$14 RETURNING *`,
      [stock_group_id, unit_id, name, sku, description, purchase_price || 0, selling_price || 0, mrp || 0, gst_percentage || 0, hsn_code, reorder_level || 0, is_active !== false, req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/stock/items/:id
router.delete('/items/:id', auth, checkCompany, async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_items WHERE id=$1 AND company_id=$2', [req.params.id, req.companyId]);
    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
