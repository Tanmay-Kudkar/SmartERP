const pool = require('../db/pool');

// Seed default ledger groups for a company
const seedDefaultGroups = async (companyId, client) => {
  const defaultGroups = [
    { name: 'Capital Account', nature: 'liability', parent: null },
    { name: 'Loans (Liability)', nature: 'liability', parent: null },
    { name: 'Current Liabilities', nature: 'liability', parent: null },
    { name: 'Sundry Creditors', nature: 'liability', parent: 'Current Liabilities' },
    { name: 'Fixed Assets', nature: 'asset', parent: null },
    { name: 'Current Assets', nature: 'asset', parent: null },
    { name: 'Sundry Debtors', nature: 'asset', parent: 'Current Assets' },
    { name: 'Cash-in-Hand', nature: 'asset', parent: 'Current Assets' },
    { name: 'Bank Accounts', nature: 'asset', parent: 'Current Assets' },
    { name: 'Sales Accounts', nature: 'income', parent: null },
    { name: 'Purchase Accounts', nature: 'expense', parent: null },
    { name: 'Direct Expenses', nature: 'expense', parent: null },
    { name: 'Indirect Expenses', nature: 'expense', parent: null },
    { name: 'Direct Income', nature: 'income', parent: null },
    { name: 'Indirect Income', nature: 'income', parent: null },
    { name: 'Duties & Taxes', nature: 'liability', parent: null },
  ];

  const groupMap = {};

  for (const group of defaultGroups) {
    const parentId = group.parent ? groupMap[group.parent] : null;
    const res = await client.query(
      `INSERT INTO ledger_groups (company_id, name, nature, parent_id, is_default) 
       VALUES ($1, $2, $3, $4, TRUE) 
       ON CONFLICT DO NOTHING RETURNING id`,
      [companyId, group.name, group.nature, parentId]
    );
    if (res.rows.length > 0) {
      groupMap[group.name] = res.rows[0].id;
    } else {
      const existing = await client.query(
        'SELECT id FROM ledger_groups WHERE company_id = $1 AND name = $2',
        [companyId, group.name]
      );
      if (existing.rows.length > 0) groupMap[group.name] = existing.rows[0].id;
    }
  }

  // Seed default ledgers: Cash and Bank
  const cashGroupId = groupMap['Cash-in-Hand'];
  await client.query(
    `INSERT INTO ledgers (company_id, group_id, name, ledger_type) 
     VALUES ($1, $2, 'Cash', 'cash')
     ON CONFLICT DO NOTHING`,
    [companyId, cashGroupId]
  );

  // Seed default units
  const defaultUnits = [
    { name: 'Pieces', symbol: 'PCS' },
    { name: 'Kilogram', symbol: 'KG' },
    { name: 'Box', symbol: 'BOX' },
    { name: 'Litre', symbol: 'LTR' },
    { name: 'Meter', symbol: 'MTR' },
    { name: 'Number', symbol: 'NOS' },
  ];
  for (const unit of defaultUnits) {
    await client.query(
      `INSERT INTO units (company_id, name, symbol) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [companyId, unit.name, unit.symbol]
    );
  }

  return groupMap;
};

module.exports = { seedDefaultGroups };
