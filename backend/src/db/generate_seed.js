const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'full_seed.sql');
let content = fs.readFileSync(sqlPath, 'utf8');

const splitMarker = '  -- ── 8. Vouchers ───────────────────────────────────────────';
if (!content.includes(splitMarker)) {
  console.error("Could not find the split marker.");
  process.exit(1);
}

const preamble = content.split(splitMarker)[0];

const sales = [
  { no: '001', date: '2024-04-05', ledger: 'v_led_1', type: 'cash', item: 'v_si_1', name: 'Samsung 55" 4K Smart TV', hsn: '85287200', qty: 1, rate: 45000, gst: 18, narration: 'Sale of Samsung TV to Ravi Kumar' },
  { no: '002', date: '2024-04-12', ledger: 'v_led_2', type: 'credit', item: 'v_si_5', name: 'Dell Inspiron 15 Laptop', hsn: '84713010', qty: 1, rate: 62000, gst: 18, narration: 'Sale of Laptops to Anil Electronics' },
  { no: '003', date: '2024-04-20', ledger: 'v_led_3', type: 'cash', item: 'v_si_8', name: 'Boat Airdopes 441', hsn: '85183000', qty: 2, rate: 2200, gst: 18, narration: 'Sale of Earbuds to Sunita Store' },
  { no: '004', date: '2024-05-03', ledger: 'v_led_4', type: 'credit', item: 'v_si_2', name: 'LG 1.5 Ton Inverter AC', hsn: '84151090', qty: 3, rate: 38000, gst: 18, narration: 'Sale of AC units to Mohan Trading' },
  { no: '005', date: '2024-05-15', ledger: 'v_led_5', type: 'bank', item: 'v_si_9', name: 'Lenovo Tab P12', hsn: '84713090', qty: 2, rate: 34000, gst: 18, narration: 'Sale of Tablets to Patel Dist' },
  { no: '006', date: '2024-06-02', ledger: 'v_led_1', type: 'credit', item: 'v_si_3', name: 'iPhone 15 Pro', hsn: '85171300', qty: 2, rate: 105000, gst: 18, narration: 'Sale of iPhones to Ravi Kumar' },
  { no: '007', date: '2024-06-18', ledger: 'v_led_2', type: 'bank', item: 'v_si_6', name: 'Canon DSLR Camera EOS', hsn: '90064000', qty: 2, rate: 54000, gst: 18, narration: 'Sale of Cameras to Anil Electronics' },
  { no: '008', date: '2024-07-04', ledger: 'v_led_3', type: 'credit', item: 'v_si_7', name: 'Sony WH-1000XM5 Headphones', hsn: '85183000', qty: 2, rate: 29000, gst: 18, narration: 'Sale of Headphones to Sunita Store' },
  { no: '009', date: '2024-07-22', ledger: 'v_led_4', type: 'bank', item: 'v_si_10', name: 'Xiaomi 43" TV', hsn: '85287200', qty: 5, rate: 23000, gst: 18, narration: 'Sale of TVs to Mohan Trading' },
  { no: '010', date: '2024-08-10', ledger: 'v_led_5', type: 'credit', item: 'v_si_12', name: 'Godrej 280L Refrigerator', hsn: '84181000', qty: 3, rate: 31000, gst: 18, narration: 'Sale of Refrigerators to Patel Dist' },
  { no: '011', date: '2024-08-25', ledger: 'v_led_1', type: 'cash', item: 'v_si_11', name: 'Philips Air Purifier', hsn: '84213990', qty: 3, rate: 11000, gst: 18, narration: 'Sale of Air Purifiers to Ravi Kumar' },
  { no: '012', date: '2024-09-05', ledger: 'v_led_2', type: 'bank', item: 'v_si_4', name: 'OnePlus 12', hsn: '85171300', qty: 3, rate: 64000, gst: 18, narration: 'Sale of OnePlus phones to Anil Elec' }
];

const purchases = [
  { no: '001', date: '2024-04-02', ledger: 'v_led_6', type: 'bank', item: 'v_si_1', name: 'Samsung 55" 4K Smart TV', hsn: '85287200', qty: 2, rate: 38000, gst: 18, narration: 'Purchase of TVs from Tata Components' },
  { no: '002', date: '2024-04-10', ledger: 'v_led_7', type: 'credit', item: 'v_si_2', name: 'LG 1.5 Ton Inverter AC', hsn: '84151090', qty: 2, rate: 32000, gst: 18, narration: 'Purchase of ACs from Reliance Supplies' },
  { no: '003', date: '2024-05-08', ledger: 'v_led_6', type: 'bank', item: 'v_si_5', name: 'Dell Inspiron 15 Laptop', hsn: '84713010', qty: 1, rate: 52000, gst: 18, narration: 'Purchase of Laptops from Tata' },
  { no: '004', date: '2024-05-20', ledger: 'v_led_7', type: 'bank', item: 'v_si_3', name: 'iPhone 15 Pro', hsn: '85171300', qty: 3, rate: 90000, gst: 18, narration: 'Purchase of iPhones from Reliance' },
  { no: '005', date: '2024-06-01', ledger: 'v_led_6', type: 'credit', item: 'v_si_6', name: 'Canon DSLR Camera EOS', hsn: '90064000', qty: 2, rate: 45000, gst: 18, narration: 'Purchase of Cameras from Tata' },
  { no: '006', date: '2024-06-15', ledger: 'v_led_7', type: 'bank', item: 'v_si_7', name: 'Sony WH-1000XM5 Headphones', hsn: '85183000', qty: 2, rate: 24000, gst: 18, narration: 'Purchase of Headphones from Reliance' },
  { no: '007', date: '2024-07-01', ledger: 'v_led_6', type: 'bank', item: 'v_si_9', name: 'Lenovo Tab P12', hsn: '84713090', qty: 2, rate: 28000, gst: 18, narration: 'Purchase of Tablets from Tata' },
  { no: '008', date: '2024-07-15', ledger: 'v_led_7', type: 'credit', item: 'v_si_8', name: 'Boat Airdopes 441', hsn: '85183000', qty: 2, rate: 1500, gst: 18, narration: 'Purchase of Earbuds from Reliance' },
  { no: '009', date: '2024-08-05', ledger: 'v_led_6', type: 'bank', item: 'v_si_12', name: 'Godrej 280L Refrigerator', hsn: '84181000', qty: 3, rate: 25000, gst: 18, narration: 'Purchase of Refrigerators from Tata' },
  { no: '010', date: '2024-08-20', ledger: 'v_led_7', type: 'bank', item: 'v_si_11', name: 'Philips Air Purifier', hsn: '84213990', qty: 2, rate: 8500, gst: 18, narration: 'Purchase of Air Purifiers from Reliance' },
  { no: '011', date: '2024-09-01', ledger: 'v_led_6', type: 'credit', item: 'v_si_4', name: 'OnePlus 12', hsn: '85171300', qty: 2, rate: 55000, gst: 18, narration: 'Purchase of OnePlus phones from Tata' },
  { no: '012', date: '2024-09-10', ledger: 'v_led_7', type: 'bank', item: 'v_si_10', name: 'Xiaomi 43" TV', hsn: '85287200', qty: 4, rate: 20000, gst: 18, narration: 'Purchase of Xiaomi TVs from Reliance' }
];

const receipts = [
  { no: '001', date: '2024-04-15', ledger: 'v_led_2', amount: 73160, type: 'bank', narration: 'Receipt from Anil Electronics against SAL/002' },
  { no: '002', date: '2024-05-10', ledger: 'v_led_4', amount: 64520, type: 'bank', narration: 'Part receipt from Mohan Trading' },
  { no: '003', date: '2024-06-05', ledger: 'v_led_5', amount: 80240, type: 'bank', narration: 'Receipt from Patel Distributors' },
  { no: '004', date: '2024-07-08', ledger: 'v_led_3', amount: 34220, type: 'cash', narration: 'Cash receipt from Sunita General Store' },
  { no: '005', date: '2024-08-12', ledger: 'v_led_1', amount: 247800, type: 'bank', narration: 'Receipt from Ravi Kumar & Co' },
  { no: '006', date: '2024-09-01', ledger: 'v_led_2', amount: 127440, type: 'bank', narration: 'Full settlement from Anil Electronics' },
  { no: '007', date: '2024-09-15', ledger: 'v_led_4', amount: 24520, type: 'cash', narration: 'Balance receipt from Mohan Trading' },
  { no: '008', date: '2024-10-03', ledger: 'v_led_5', amount: 109740, type: 'bank', narration: 'Advance from Patel Distributors' },
  { no: '009', date: '2024-10-20', ledger: 'v_led_1', amount: 127800, type: 'bank', narration: 'Receipt from Ravi Kumar partial' },
  { no: '010', date: '2024-11-05', ledger: 'v_led_3', amount: 68440, type: 'cash', narration: 'Receipt from Sunita General Store' },
  { no: '011', date: '2024-11-18', ledger: 'v_led_4', amount: 135700, type: 'bank', narration: 'Final settlement Mohan Trading SAL/009' },
  { no: '012', date: '2024-12-02', ledger: 'v_led_5', amount: 59740, type: 'bank', narration: 'Balance payment Patel Distributors' }
];

let sql = preamble + splitMarker + '\n';
sql += `  -- Sales Vouchers\n  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,subtotal,taxable_amount,cgst_amount,sgst_amount,total_gst,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES\n`;
const sVals = sales.map(s => {
  const tax = s.qty * s.rate;
  const gst = tax * (s.gst / 100);
  const total = tax + gst;
  const paid = (s.type === 'credit') ? 0 : total;
  const bal = total - paid;
  return `    (v_cid,'sales','SAL/24-25/${s.no}','${s.date}',${s.ledger},'${s.narration}',${tax},${tax},${gst/2},${gst/2},${gst},${total},${paid},${bal},'${s.type}','active')`;
});
sql += sVals.join(',\n') + `\n  ON CONFLICT DO NOTHING;\n\n`;

sql += `  -- Purchase Vouchers\n  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,subtotal,taxable_amount,cgst_amount,sgst_amount,total_gst,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES\n`;
const pVals = purchases.map(p => {
  const tax = p.qty * p.rate;
  const gst = tax * (p.gst / 100);
  const total = tax + gst;
  const paid = (p.type === 'credit') ? 0 : total;
  const bal = total - paid;
  return `    (v_cid,'purchase','PUR/24-25/${p.no}','${p.date}',${p.ledger},'${p.narration}',${tax},${tax},${gst/2},${gst/2},${gst},${total},${paid},${bal},'${p.type}','active')`;
});
sql += pVals.join(',\n') + `\n  ON CONFLICT DO NOTHING;\n\n`;

sql += `  -- Receipt Vouchers\n  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES\n`;
const rVals = receipts.map(r => {
  return `    (v_cid,'receipt','RCT/24-25/${r.no}','${r.date}',${r.ledger},'${r.narration}',${r.amount},${r.amount},0,'${r.type}','active')`;
});
sql += rVals.join(',\n') + `\n  ON CONFLICT DO NOTHING;\n\n`;

sql += `  -- ── 9. Voucher Items ─────────────────────────────────────\n`;
sales.forEach(s => {
  const tax = s.qty * s.rate;
  const gst = tax * (s.gst / 100);
  const total = tax + gst;
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/${s.no}' LIMIT 1;\n`;
  sql += `  IF v_vou IS NOT NULL AND ${s.item} IS NOT NULL THEN\n`;
  sql += `    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)\n`;
  sql += `    VALUES (v_vou,${s.item},'${s.name}','${s.hsn}',${s.qty},v_unit_pcs,${s.rate},${tax},18,9,${gst/2},9,${gst/2},${total})\n`;
  sql += `    ON CONFLICT DO NOTHING;\n  END IF;\n\n`;
});
purchases.forEach(p => {
  const tax = p.qty * p.rate;
  const gst = tax * (p.gst / 100);
  const total = tax + gst;
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/${p.no}' LIMIT 1;\n`;
  sql += `  IF v_vou IS NOT NULL AND ${p.item} IS NOT NULL THEN\n`;
  sql += `    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)\n`;
  sql += `    VALUES (v_vou,${p.item},'${p.name}','${p.hsn}',${p.qty},v_unit_pcs,${p.rate},${tax},18,9,${gst/2},9,${gst/2},${total})\n`;
  sql += `    ON CONFLICT DO NOTHING;\n  END IF;\n\n`;
});

sql += `  -- ── 10. Inventory Transactions ────────────────────────────\n`;
sales.forEach(s => {
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/${s.no}' LIMIT 1;\n`;
  sql += `  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)\n`;
  sql += `  VALUES (v_cid,${s.item},v_vou,'out',${s.qty},${s.rate},'${s.date}','${s.narration}') ON CONFLICT DO NOTHING;\n`;
});
sql += '\n';
purchases.forEach(p => {
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/${p.no}' LIMIT 1;\n`;
  sql += `  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)\n`;
  sql += `  VALUES (v_cid,${p.item},v_vou,'in',${p.qty},${p.rate},'${p.date}','${p.narration}') ON CONFLICT DO NOTHING;\n`;
});
sql += '\n';

sql += `  -- ── 11. Ledger Transactions ───────────────────────────────\n`;
sales.forEach(s => {
  const tax = s.qty * s.rate;
  const gst = tax * (s.gst / 100);
  const total = tax + gst;
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/${s.no}' LIMIT 1;\n`;
  sql += `  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES\n`;
  sql += `    (v_cid,${s.ledger},v_vou,'${s.date}',${total},0,'${s.narration} (Dr)'),\n`;
  sql += `    (v_cid,v_led_sales,v_vou,'${s.date}',0,${tax},'${s.narration} (Cr Sales)');\n`;
});
sql += '\n';

purchases.forEach(p => {
  const tax = p.qty * p.rate;
  const gst = tax * (p.gst / 100);
  const total = tax + gst;
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/${p.no}' LIMIT 1;\n`;
  sql += `  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES\n`;
  sql += `    (v_cid,${p.ledger},v_vou,'${p.date}',0,${total},'${p.narration} (Cr)'),\n`;
  sql += `    (v_cid,v_led_purch,v_vou,'${p.date}',${tax},0,'${p.narration} (Dr Purchase)');\n`;
});
sql += '\n';

receipts.forEach(r => {
  sql += `  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/${r.no}' LIMIT 1;\n`;
  sql += `  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES\n`;
  sql += `    (v_cid,v_led_bank,v_vou,'${r.date}',${r.amount},0,'${r.narration} (Dr Bank)'),\n`;
  sql += `    (v_cid,${r.ledger},v_vou,'${r.date}',0,${r.amount},'${r.narration} (Cr Party)');\n`;
});

sql += `\n  RAISE NOTICE 'Seed data inserted for company_id=%', v_cid;\nEND $$;\n`;

fs.writeFileSync(sqlPath, sql, 'utf8');
console.log('Successfully regenerated full_seed.sql');
