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

// Generate voucher number
const generateVoucherNumber = async (client, companyId, type) => {
  const prefix = type === 'sales' ? 'INV' : type === 'purchase' ? 'PUR' : type.toUpperCase().substring(0, 3);
  const result = await client.query(
    `SELECT COUNT(*) FROM vouchers WHERE company_id = $1 AND voucher_type = $2`,
    [companyId, type]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `${prefix}-${String(count).padStart(5, '0')}`;
};

// GET /api/vouchers - list vouchers
router.get('/', auth, checkCompany, async (req, res) => {
  try {
    const { type, from_date, to_date, search } = req.query;
    let query = `
      SELECT v.*, l.name as party_name
      FROM vouchers v
      LEFT JOIN ledgers l ON v.ledger_id = l.id
      WHERE v.company_id = $1 AND v.status = 'active'
    `;
    const params = [req.companyId];
    if (type) { params.push(type); query += ` AND v.voucher_type = $${params.length}`; }
    if (from_date) { params.push(from_date); query += ` AND v.voucher_date >= $${params.length}`; }
    if (to_date) { params.push(to_date); query += ` AND v.voucher_date <= $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (v.voucher_number ILIKE $${params.length} OR l.name ILIKE $${params.length})`; }
    query += ' ORDER BY v.voucher_date DESC, v.id DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, vouchers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/vouchers - create voucher (sales or purchase)
router.post('/', auth, checkCompany, async (req, res) => {
  const client = await pool.connect();
  try {
    const { voucher_type, voucher_date, ledger_id, items, narration, payment_mode, is_interstate, paid_amount } = req.body;
    if (!voucher_type || !voucher_date || !ledger_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'voucher_type, voucher_date, ledger_id, and items are required.' });
    }

    await client.query('BEGIN');

    const voucher_number = await generateVoucherNumber(client, req.companyId, voucher_type);

    // Calculate totals
    let subtotal = 0, total_cgst = 0, total_sgst = 0, total_igst = 0;
    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const discPct = parseFloat(item.discount_percent) || 0;
      const gross = qty * rate;
      const discAmt = (gross * discPct) / 100;
      const taxable = gross - discAmt;
      const gstPct = parseFloat(item.gst_percentage) || 0;
      let cgst_pct = 0, sgst_pct = 0, igst_pct = 0;
      let cgst_amt = 0, sgst_amt = 0, igst_amt = 0;
      if (is_interstate) {
        igst_pct = gstPct;
        igst_amt = (taxable * igst_pct) / 100;
        total_igst += igst_amt;
      } else {
        cgst_pct = gstPct / 2;
        sgst_pct = gstPct / 2;
        cgst_amt = (taxable * cgst_pct) / 100;
        sgst_amt = (taxable * sgst_pct) / 100;
        total_cgst += cgst_amt;
        total_sgst += sgst_amt;
      }
      const total_amount = taxable + cgst_amt + sgst_amt + igst_amt;
      subtotal += gross;
      return { ...item, discount_amount: discAmt, taxable_amount: taxable, cgst_pct, sgst_pct, igst_pct, cgst_amt, sgst_amt, igst_amt, total_amount };
    });

    const total_discount = processedItems.reduce((s, i) => s + i.discount_amount, 0);
    const taxable_amount = processedItems.reduce((s, i) => s + i.taxable_amount, 0);
    const total_gst = total_cgst + total_sgst + total_igst;
    const grand_total = taxable_amount + total_gst;
    const paid = parseFloat(paid_amount) || 0;
    const balance = grand_total - paid;

    // Insert voucher
    const vResult = await client.query(
      `INSERT INTO vouchers (company_id, voucher_type, voucher_number, voucher_date, ledger_id, narration, subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, total_gst, grand_total, paid_amount, balance_amount, payment_mode, is_interstate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.companyId, voucher_type, voucher_number, voucher_date, ledger_id, narration, subtotal, total_discount, taxable_amount, total_cgst, total_sgst, total_igst, total_gst, grand_total, paid, balance, payment_mode || 'credit', is_interstate || false]
    );
    const voucher = vResult.rows[0];

    // Insert voucher items + update stock
    for (const item of processedItems) {
      await client.query(
        `INSERT INTO voucher_items (voucher_id, stock_item_id, item_name, hsn_code, quantity, unit_id, rate, discount_percent, discount_amount, taxable_amount, gst_percentage, cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [voucher.id, item.stock_item_id, item.item_name, item.hsn_code, item.quantity, item.unit_id, item.rate, item.discount_percent || 0, item.discount_amount, item.taxable_amount, item.gst_percentage || 0, item.cgst_pct, item.cgst_amt, item.sgst_pct, item.sgst_amt, item.igst_pct, item.igst_amt, item.total_amount]
      );

      // Update stock
      if (item.stock_item_id) {
        const stockChange = voucher_type === 'purchase' ? parseFloat(item.quantity) : -parseFloat(item.quantity);
        await client.query(
          'UPDATE stock_items SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2 AND company_id = $3',
          [stockChange, item.stock_item_id, req.companyId]
        );
        await client.query(
          `INSERT INTO inventory_transactions (company_id, stock_item_id, voucher_id, transaction_type, quantity, rate, transaction_date, narration)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [req.companyId, item.stock_item_id, voucher.id, voucher_type === 'purchase' ? 'in' : 'out', Math.abs(item.quantity), item.rate, voucher_date, narration]
        );
      }
    }

    // Ledger transactions (party ledger)
    const partyDebit = voucher_type === 'sales' ? grand_total : 0;
    const partyCredit = voucher_type === 'purchase' ? grand_total : 0;
    await client.query(
      `INSERT INTO ledger_transactions (company_id, ledger_id, voucher_id, transaction_date, debit_amount, credit_amount, narration)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.companyId, ledger_id, voucher.id, voucher_date, partyDebit, partyCredit, narration]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, voucher });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

// GET /api/vouchers/:id
router.get('/:id', auth, checkCompany, async (req, res) => {
  try {
    const vResult = await pool.query(
      `SELECT v.*, l.name as party_name, l.address as party_address, l.gst_number as party_gst, l.phone as party_phone, c.name as company_name, c.address as company_address, c.gst_number as company_gst, c.phone as company_phone, c.state as company_state
       FROM vouchers v
       LEFT JOIN ledgers l ON v.ledger_id = l.id
       LEFT JOIN companies c ON v.company_id = c.id
       WHERE v.id = $1 AND v.company_id = $2`,
      [req.params.id, req.companyId]
    );
    if (vResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Voucher not found.' });
    const itemsResult = await pool.query(
      'SELECT vi.*, u.symbol as unit_symbol FROM voucher_items vi LEFT JOIN units u ON vi.unit_id = u.id WHERE vi.voucher_id = $1 ORDER BY vi.id',
      [req.params.id]
    );
    res.json({ success: true, voucher: vResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/vouchers/:id (cancel)
router.delete('/:id', auth, checkCompany, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vResult = await client.query('SELECT * FROM vouchers WHERE id=$1 AND company_id=$2', [req.params.id, req.companyId]);
    if (vResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Voucher not found.' });
    const voucher = vResult.rows[0];
    const items = await client.query('SELECT * FROM voucher_items WHERE voucher_id = $1', [req.params.id]);
    // Reverse stock
    for (const item of items.rows) {
      if (item.stock_item_id) {
        const stockChange = voucher.voucher_type === 'purchase' ? -parseFloat(item.quantity) : parseFloat(item.quantity);
        await client.query('UPDATE stock_items SET current_stock = current_stock + $1 WHERE id = $2', [stockChange, item.stock_item_id]);
      }
    }
    await client.query("UPDATE vouchers SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Voucher cancelled.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
});

// GET /api/vouchers/summary/dashboard
router.get('/summary/dashboard', auth, checkCompany, async (req, res) => {
  try {
    const sales = await pool.query(
      `SELECT COALESCE(SUM(grand_total),0) as total FROM vouchers WHERE company_id=$1 AND voucher_type='sales' AND status='active'`,
      [req.companyId]
    );
    const purchases = await pool.query(
      `SELECT COALESCE(SUM(grand_total),0) as total FROM vouchers WHERE company_id=$1 AND voucher_type='purchase' AND status='active'`,
      [req.companyId]
    );
    const outstanding = await pool.query(
      `SELECT COALESCE(SUM(balance_amount),0) as total FROM vouchers WHERE company_id=$1 AND status='active' AND balance_amount > 0`,
      [req.companyId]
    );
    const stockCount = await pool.query(
      `SELECT COUNT(*) as total FROM stock_items WHERE company_id=$1 AND is_active=true`,
      [req.companyId]
    );
    res.json({
      success: true,
      summary: {
        total_sales: parseFloat(sales.rows[0].total),
        total_purchases: parseFloat(purchases.rows[0].total),
        total_outstanding: parseFloat(outstanding.rows[0].total),
        stock_items: parseInt(stockCount.rows[0].total),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/vouchers/reports/all
router.get('/reports/all', auth, checkCompany, async (req, res) => {
  try {
    // 1. Financial totals
    const financialRes = await pool.query(
      `SELECT 
         voucher_type,
         COUNT(*) as count,
         COALESCE(SUM(grand_total), 0) as total_grand,
         COALESCE(SUM(taxable_amount), 0) as total_taxable,
         COALESCE(SUM(total_gst), 0) as total_gst
       FROM vouchers 
       WHERE company_id = $1 AND status = 'active'
       GROUP BY voucher_type`,
      [req.companyId]
    );

    // 2. Ledger balances
    const ledgersRes = await pool.query(
      `SELECT 
         l.id, 
         l.name, 
         l.ledger_type, 
         l.opening_balance, 
         l.balance_type,
         COALESCE(SUM(lt.debit_amount), 0) as total_debit,
         COALESCE(SUM(lt.credit_amount), 0) as total_credit
       FROM ledgers l
       LEFT JOIN ledger_transactions lt ON l.id = lt.ledger_id
       WHERE l.company_id = $1
       GROUP BY l.id, l.name, l.ledger_type, l.opening_balance, l.balance_type
       ORDER BY l.name`,
      [req.companyId]
    );

    // 3. Stock items summary
    const stockRes = await pool.query(
      `SELECT 
         si.id,
         si.name,
         sg.name as group_name,
         si.current_stock,
         si.purchase_price,
         si.selling_price,
         u.symbol as unit_symbol
       FROM stock_items si
       LEFT JOIN stock_groups sg ON si.stock_group_id = sg.id
       LEFT JOIN units u ON si.unit_id = u.id
       WHERE si.company_id = $1 AND si.is_active = true
       ORDER BY si.name`,
      [req.companyId]
    );

    res.json({
      success: true,
      financials: financialRes.rows,
      ledgers: ledgersRes.rows,
      stock: stockRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error generating report data.' });
  }
});

module.exports = router;
