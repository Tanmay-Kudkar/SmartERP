-- ============================================================
-- SmartERP Full Data Seed Script
-- Run as: psql -U postgres -d smarterp -f seed_data.sql
-- ============================================================

-- ── 1. Users ────────────────────────────────────────────────
INSERT INTO users (name, email, password, role) VALUES
  ('Tanmay Kudkar',   'kudkartanmay25@gmail.com',   '$2b$10$JyFX33/jkzHUDXPt3kAVo.MlnvPKkMYymrf2u2EneC4fto0UQVMp2', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ── 2. Companies (all under user id=1) ──────────────────────
DO $$
DECLARE v_uid INTEGER;
BEGIN
  SELECT id INTO v_uid FROM users WHERE email='kudkartanmay25@gmail.com';
  INSERT INTO companies (user_id,name,address,city,state,pincode,gst_number,pan_number,phone,email,financial_year_start,financial_year_end) VALUES
    (v_uid,'Tanmay Traders Pvt Ltd','12, MG Road','Pune','Maharashtra','411001','27AABCK1234A1Z5','AABCK1234A','9876543210','info@kudkartraders.in','2024-04-01','2025-03-31'),
    (v_uid,'Priya Traders Pvt Ltd',    '45, Laxmi Nagar','Mumbai','Maharashtra','400001','27AABCS5678B2Z6','AABCS5678B','9123456789','contact@sharmaelec.in','2024-04-01','2025-03-31'),
    (v_uid,'Rahul Traders Pvt Ltd',          '78, Station Road','Nashik','Maharashtra','422001','27AABCD9012C3Z7','AABCD9012C','9988776655','sales@desaipharma.in','2024-04-01','2025-03-31'),
    (v_uid,'Sneha Traders Pvt Ltd', '23, MIDC Area','Solapur','Maharashtra','413001','27AABCP3456D4Z8','AABCP3456D','8877665544','info@patilagro.in','2024-04-01','2025-03-31')
  ON CONFLICT DO NOTHING;
END $$;

-- ── Helper: get company_id for main company ──────────────────
-- All ledger_groups, units, stock_items etc. created by seedDefaultGroups
-- We work with the first company only for the detailed data

DO $$
DECLARE
  v_cid   INTEGER;
  v_grp_sundry_debtors  INTEGER;
  v_grp_sundry_creditors INTEGER;
  v_grp_bank            INTEGER;
  v_grp_cash            INTEGER;
  v_grp_sales           INTEGER;
  v_grp_purchase        INTEGER;
  v_grp_indirect_exp    INTEGER;
  v_grp_indirect_inc    INTEGER;
  v_unit_pcs INTEGER; v_unit_kg INTEGER; v_unit_box INTEGER;
  v_unit_ltr INTEGER; v_unit_mtr INTEGER; v_unit_nos INTEGER;
  -- ledger ids
  v_led_1 INTEGER; v_led_2 INTEGER; v_led_3 INTEGER;
  v_led_4 INTEGER; v_led_5 INTEGER; v_led_6 INTEGER;
  v_led_7 INTEGER; v_led_8 INTEGER; v_led_9 INTEGER; v_led_10 INTEGER;
  v_led_bank INTEGER; v_led_sales INTEGER; v_led_purch INTEGER;
  -- stock item ids
  v_si_1 INTEGER; v_si_2 INTEGER; v_si_3 INTEGER; v_si_4 INTEGER;
  v_si_5 INTEGER; v_si_6 INTEGER; v_si_7 INTEGER; v_si_8 INTEGER;
  v_si_9 INTEGER; v_si_10 INTEGER; v_si_11 INTEGER; v_si_12 INTEGER;
  -- stock group id
  v_sg INTEGER;
  -- voucher ids
  v_vou INTEGER;
BEGIN
  SELECT id INTO v_cid FROM companies WHERE email='info@kudkartraders.in' LIMIT 1;
  IF v_cid IS NULL THEN RAISE NOTICE 'Company not found, skipping.'; RETURN; END IF;

  
  -- ── 2b. Default Ledger Groups ────────────────────────────────
  INSERT INTO ledger_groups (company_id, name, nature, is_default) VALUES
    (v_cid, 'Capital Account', 'liability', TRUE),
    (v_cid, 'Loans (Liability)', 'liability', TRUE),
    (v_cid, 'Current Liabilities', 'liability', TRUE),
    (v_cid, 'Fixed Assets', 'asset', TRUE),
    (v_cid, 'Current Assets', 'asset', TRUE),
    (v_cid, 'Sales Accounts', 'income', TRUE),
    (v_cid, 'Purchase Accounts', 'expense', TRUE),
    (v_cid, 'Direct Expenses', 'expense', TRUE),
    (v_cid, 'Indirect Expenses', 'expense', TRUE),
    (v_cid, 'Direct Income', 'income', TRUE),
    (v_cid, 'Indirect Income', 'income', TRUE),
    (v_cid, 'Duties & Taxes', 'liability', TRUE)
  ON CONFLICT DO NOTHING;

  DECLARE 
    curr_liab INTEGER;
    curr_asset INTEGER;
  BEGIN
    SELECT id INTO curr_liab FROM ledger_groups WHERE company_id=v_cid AND name='Current Liabilities' LIMIT 1;
    SELECT id INTO curr_asset FROM ledger_groups WHERE company_id=v_cid AND name='Current Assets' LIMIT 1;

    INSERT INTO ledger_groups (company_id, name, nature, parent_id, is_default) VALUES
      (v_cid, 'Sundry Creditors', 'liability', curr_liab, TRUE),
      (v_cid, 'Sundry Debtors', 'asset', curr_asset, TRUE),
      (v_cid, 'Cash-in-Hand', 'asset', curr_asset, TRUE),
      (v_cid, 'Bank Accounts', 'asset', curr_asset, TRUE)
    ON CONFLICT DO NOTHING;
  END;

  -- Seed Cash Ledger
  DECLARE cash_grp INTEGER;
  BEGIN
    SELECT id INTO cash_grp FROM ledger_groups WHERE company_id=v_cid AND name='Cash-in-Hand' LIMIT 1;
    INSERT INTO ledgers (company_id, group_id, name, ledger_type) VALUES (v_cid, cash_grp, 'Cash', 'cash') ON CONFLICT DO NOTHING;
  END;

  -- ── 3. Stock Groups ────────────────────────────────────────
  INSERT INTO stock_groups (company_id, name) VALUES
    (v_cid,'Electronics'),
    (v_cid,'Furniture'),
    (v_cid,'Groceries'),
    (v_cid,'Clothing'),
    (v_cid,'Stationery'),
    (v_cid,'Hardware'),
    (v_cid,'Medicines'),
    (v_cid,'Beverages'),
    (v_cid,'Cosmetics'),
    (v_cid,'Automotive'),
    (v_cid,'Books'),
    (v_cid,'Sports Equipment')
  ON CONFLICT DO NOTHING;
  SELECT id INTO v_sg FROM stock_groups WHERE company_id=v_cid AND name='Electronics' LIMIT 1;

  -- ── 4. Extra Units (beyond seed defaults) ─────────────────
  SELECT id INTO v_unit_pcs FROM units WHERE company_id=v_cid AND symbol='PCS' LIMIT 1;
  SELECT id INTO v_unit_kg  FROM units WHERE company_id=v_cid AND symbol='KG'  LIMIT 1;
  SELECT id INTO v_unit_box FROM units WHERE company_id=v_cid AND symbol='BOX' LIMIT 1;
  SELECT id INTO v_unit_ltr FROM units WHERE company_id=v_cid AND symbol='LTR' LIMIT 1;
  SELECT id INTO v_unit_mtr FROM units WHERE company_id=v_cid AND symbol='MTR' LIMIT 1;
  SELECT id INTO v_unit_nos FROM units WHERE company_id=v_cid AND symbol='NOS' LIMIT 1;

  INSERT INTO units (company_id, name, symbol) VALUES
    
    (v_cid,'Pieces',  'PCS'),
    (v_cid,'Kilogram','KG'),
    (v_cid,'Box',     'BOX'),
    (v_cid,'Litre',   'LTR'),
    (v_cid,'Meter',   'MTR'),
    (v_cid,'Number',  'NOS'),
    (v_cid,'Gram',    'GMS'),
    (v_cid,'Dozen',   'DZN'),
    (v_cid,'Pair',    'PR'),
    (v_cid,'Set',     'SET'),
    (v_cid,'Quintal', 'QNT'),
    (v_cid,'Ton',     'TON')
  ON CONFLICT DO NOTHING;

  -- ── 5. Ledger Groups (fetching auto-seeded ones) ──────────
  SELECT id INTO v_grp_sundry_debtors  FROM ledger_groups WHERE company_id=v_cid AND name='Sundry Debtors'   LIMIT 1;
  SELECT id INTO v_grp_sundry_creditors FROM ledger_groups WHERE company_id=v_cid AND name='Sundry Creditors' LIMIT 1;
  SELECT id INTO v_grp_bank            FROM ledger_groups WHERE company_id=v_cid AND name='Bank Accounts'    LIMIT 1;
  SELECT id INTO v_grp_cash            FROM ledger_groups WHERE company_id=v_cid AND name='Cash-in-Hand'     LIMIT 1;
  SELECT id INTO v_grp_sales           FROM ledger_groups WHERE company_id=v_cid AND name='Sales Accounts'   LIMIT 1;
  SELECT id INTO v_grp_purchase        FROM ledger_groups WHERE company_id=v_cid AND name='Purchase Accounts' LIMIT 1;
  SELECT id INTO v_grp_indirect_exp    FROM ledger_groups WHERE company_id=v_cid AND name='Indirect Expenses' LIMIT 1;
  SELECT id INTO v_grp_indirect_inc    FROM ledger_groups WHERE company_id=v_cid AND name='Indirect Income'   LIMIT 1;

  -- ── 6. Ledgers ────────────────────────────────────────────
  INSERT INTO ledgers (company_id,group_id,name,ledger_type,opening_balance,balance_type,gst_number,phone,email,state,city)
  VALUES
    (v_cid,v_grp_sundry_debtors, 'Ravi Kumar & Co',        'debtor',   25000, 'Dr','27AABCR1111A1Z1','9870001111','ravi@example.com',    'Maharashtra','Pune'),
    (v_cid,v_grp_sundry_debtors, 'Anil Electronics',        'debtor',   42000, 'Dr','27AABCA2222B2Z2','9870002222','anil@example.com',    'Maharashtra','Mumbai'),
    (v_cid,v_grp_sundry_debtors, 'Sunita General Store',    'debtor',   18500, 'Dr','27AABCS3333C3Z3','9870003333','sunita@example.com',  'Maharashtra','Nashik'),
    (v_cid,v_grp_sundry_debtors, 'Mohan Trading Co',        'debtor',   67000, 'Dr','29AABCM4444D4Z4','9870004444','mohan@example.com',   'Karnataka','Bengaluru'),
    (v_cid,v_grp_sundry_debtors, 'Patel Distributors',      'debtor',   33000, 'Dr','24AABCP5555E5Z5','9870005555','patel@example.com',   'Gujarat','Surat'),
    (v_cid,v_grp_sundry_creditors,'Tata Components Ltd',    'creditor', 55000, 'Cr','27AABCT6666F6Z6','9870006666','tata@example.com',    'Maharashtra','Pune'),
    (v_cid,v_grp_sundry_creditors,'Reliance Supplies',      'creditor', 89000, 'Cr','27AABCR7777G7Z7','9870007777','reliance@example.com','Maharashtra','Mumbai'),
    (v_cid,v_grp_sundry_creditors,'Samsung Distributors',   'creditor', 71000, 'Cr','07AABCS8888H8Z8','9870008888','samsung@example.com', 'Delhi','New Delhi'),
    (v_cid,v_grp_sundry_creditors,'LG Electronics Pvt Ltd', 'creditor', 43000, 'Cr','27AABCL9999I9Z9','9870009999','lg@example.com',      'Maharashtra','Pune'),
    (v_cid,v_grp_sundry_creditors,'Bajaj Electricals',      'creditor', 28000, 'Cr','27AABCB0000J0Z0','9870000000','bajaj@example.com',   'Maharashtra','Mumbai'),
    (v_cid,v_grp_bank,           'HDFC Bank - Current',    'bank',     150000,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_bank,           'SBI - Savings',          'bank',      75000,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_bank,           'ICICI - OD Account',     'bank',      20000,'Cr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_sales,          'Local Sales',            'sales',         0,'Cr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_sales,          'Export Sales',           'sales',         0,'Cr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_purchase,       'Local Purchase',         'purchase',      0,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_purchase,       'Import Purchase',        'purchase',      0,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_indirect_exp,   'Salary Expenses',        'expense',       0,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_indirect_exp,   'Electricity Charges',    'expense',       0,'Dr', NULL,NULL,NULL,NULL,NULL),
    (v_cid,v_grp_indirect_exp,   'Rent Paid',              'expense',       0,'Dr', NULL,NULL,NULL,NULL,NULL)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_led_1  FROM ledgers WHERE company_id=v_cid AND name='Ravi Kumar & Co'    LIMIT 1;
  SELECT id INTO v_led_2  FROM ledgers WHERE company_id=v_cid AND name='Anil Electronics'   LIMIT 1;
  SELECT id INTO v_led_3  FROM ledgers WHERE company_id=v_cid AND name='Sunita General Store' LIMIT 1;
  SELECT id INTO v_led_4  FROM ledgers WHERE company_id=v_cid AND name='Mohan Trading Co'   LIMIT 1;
  SELECT id INTO v_led_5  FROM ledgers WHERE company_id=v_cid AND name='Patel Distributors' LIMIT 1;
  SELECT id INTO v_led_6  FROM ledgers WHERE company_id=v_cid AND name='Tata Components Ltd' LIMIT 1;
  SELECT id INTO v_led_7  FROM ledgers WHERE company_id=v_cid AND name='Reliance Supplies'  LIMIT 1;
  SELECT id INTO v_led_bank  FROM ledgers WHERE company_id=v_cid AND name='HDFC Bank - Current' LIMIT 1;
  SELECT id INTO v_led_sales FROM ledgers WHERE company_id=v_cid AND name='Local Sales'     LIMIT 1;
  SELECT id INTO v_led_purch FROM ledgers WHERE company_id=v_cid AND name='Local Purchase'  LIMIT 1;

  -- ── 7. Stock Items ────────────────────────────────────────
  INSERT INTO stock_items (company_id,stock_group_id,unit_id,name,sku,description,purchase_price,selling_price,mrp,gst_percentage,hsn_code,opening_stock,current_stock,reorder_level)
  VALUES
    (v_cid,v_sg,v_unit_pcs,'Samsung 55" 4K Smart TV',  'SAM-TV-55',  'UHD QLED Television',      38000, 45000, 48000, 18,'85287200',  5, 12, 3),
    (v_cid,v_sg,v_unit_pcs,'LG 1.5 Ton Inverter AC',   'LG-AC-15',   '5-star split AC',          32000, 38000, 42000, 28,'84151090',  8, 15, 4),
    (v_cid,v_sg,v_unit_pcs,'iPhone 15 Pro',            'APL-IP15P',  '256GB Space Black',        90000,105000,110000, 18,'85171300',  3,  8, 2),
    (v_cid,v_sg,v_unit_pcs,'OnePlus 12',               'OP-12-256',  '256GB Green',              55000, 64000, 67000, 18,'85171300',  6, 14, 3),
    (v_cid,v_sg,v_unit_pcs,'Dell Inspiron 15 Laptop',  'DELL-INS15', 'Intel i5 16GB 512GB SSD',  52000, 62000, 65000, 18,'84713010', 10, 20, 5),
    (v_cid,v_sg,v_unit_pcs,'Canon DSLR Camera EOS',    'CAN-EOS-90', '24MP DSLR',                45000, 54000, 58000, 18,'90064000',  4,  9, 2),
    (v_cid,v_sg,v_unit_pcs,'Sony WH-1000XM5 Headphones','SNY-WH5',  'Noise Cancelling',          24000, 29000, 32000, 18,'85183000',  7, 18, 5),
    (v_cid,v_sg,v_unit_pcs,'Boat Airdopes 441',        'BOT-AD441',  'TWS Earbuds',                1500,  2200,  2500, 18,'85183000', 20, 45,10),
    (v_cid,v_sg,v_unit_pcs,'Lenovo Tab P12',           'LNV-TP12',   '12" Android Tablet',       28000, 34000, 37000, 18,'84713090',  5, 12, 3),
    (v_cid,v_sg,v_unit_pcs,'Xiaomi 43" TV',            'XMI-TV43',   'FHD Android TV',           18000, 23000, 25000, 18,'85287200', 12, 25, 6),
    (v_cid,v_sg,v_unit_pcs,'Philips Air Purifier',     'PHI-AP800',  'HEPA Filter',               8500, 11000, 12500, 18,'84213990',  8, 20, 5),
    (v_cid,v_sg,v_unit_pcs,'Godrej 280L Refrigerator', 'GDJ-FR280',  'Double Door Frost Free',   25000, 31000, 34000, 18,'84181000',  6, 14, 3)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_si_1  FROM stock_items WHERE company_id=v_cid AND sku='SAM-TV-55'  LIMIT 1;
  SELECT id INTO v_si_2  FROM stock_items WHERE company_id=v_cid AND sku='LG-AC-15'   LIMIT 1;
  SELECT id INTO v_si_3  FROM stock_items WHERE company_id=v_cid AND sku='APL-IP15P'  LIMIT 1;
  SELECT id INTO v_si_4  FROM stock_items WHERE company_id=v_cid AND sku='OP-12-256'  LIMIT 1;
  SELECT id INTO v_si_5  FROM stock_items WHERE company_id=v_cid AND sku='DELL-INS15' LIMIT 1;
  SELECT id INTO v_si_6  FROM stock_items WHERE company_id=v_cid AND sku='CAN-EOS-90' LIMIT 1;
  SELECT id INTO v_si_7  FROM stock_items WHERE company_id=v_cid AND sku='SNY-WH5'   LIMIT 1;
  SELECT id INTO v_si_8  FROM stock_items WHERE company_id=v_cid AND sku='BOT-AD441'  LIMIT 1;
  SELECT id INTO v_si_9  FROM stock_items WHERE company_id=v_cid AND sku='LNV-TP12'  LIMIT 1;
  SELECT id INTO v_si_10 FROM stock_items WHERE company_id=v_cid AND sku='XMI-TV43'  LIMIT 1;
  SELECT id INTO v_si_11 FROM stock_items WHERE company_id=v_cid AND sku='PHI-AP800'  LIMIT 1;
  SELECT id INTO v_si_12 FROM stock_items WHERE company_id=v_cid AND sku='GDJ-FR280'  LIMIT 1;

  -- ── 8. Vouchers ───────────────────────────────────────────
  -- Sales Vouchers
  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,subtotal,taxable_amount,cgst_amount,sgst_amount,total_gst,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES
    (v_cid,'sales','SAL/24-25/001','2024-04-05',v_led_1,'Sale of Samsung TV to Ravi Kumar',45000,45000,4050,4050,8100,53100,53100,0,'cash','active'),
    (v_cid,'sales','SAL/24-25/002','2024-04-12',v_led_2,'Sale of Laptops to Anil Electronics',62000,62000,5580,5580,11160,73160,0,73160,'credit','active'),
    (v_cid,'sales','SAL/24-25/003','2024-04-20',v_led_3,'Sale of Earbuds to Sunita Store',4400,4400,396,396,792,5192,5192,0,'cash','active'),
    (v_cid,'sales','SAL/24-25/004','2024-05-03',v_led_4,'Sale of AC units to Mohan Trading',114000,114000,10260,10260,20520,134520,0,134520,'credit','active'),
    (v_cid,'sales','SAL/24-25/005','2024-05-15',v_led_5,'Sale of Tablets to Patel Dist',68000,68000,6120,6120,12240,80240,80240,0,'bank','active'),
    (v_cid,'sales','SAL/24-25/006','2024-06-02',v_led_1,'Sale of iPhones to Ravi Kumar',210000,210000,18900,18900,37800,247800,0,247800,'credit','active'),
    (v_cid,'sales','SAL/24-25/007','2024-06-18',v_led_2,'Sale of Cameras to Anil Electronics',108000,108000,9720,9720,19440,127440,127440,0,'bank','active'),
    (v_cid,'sales','SAL/24-25/008','2024-07-04',v_led_3,'Sale of Headphones to Sunita Store',58000,58000,5220,5220,10440,68440,0,68440,'credit','active'),
    (v_cid,'sales','SAL/24-25/009','2024-07-22',v_led_4,'Sale of TVs to Mohan Trading',115000,115000,10350,10350,20700,135700,135700,0,'bank','active'),
    (v_cid,'sales','SAL/24-25/010','2024-08-10',v_led_5,'Sale of Refrigerators to Patel Dist',93000,93000,8370,8370,16740,109740,0,109740,'credit','active'),
    (v_cid,'sales','SAL/24-25/011','2024-08-25',v_led_1,'Sale of Air Purifiers to Ravi Kumar',33000,33000,2970,2970,5940,38940,38940,0,'cash','active'),
    (v_cid,'sales','SAL/24-25/012','2024-09-05',v_led_2,'Sale of OnePlus phones to Anil Elec',192000,192000,17280,17280,34560,226560,226560,0,'bank','active')
  ON CONFLICT DO NOTHING;

  -- Purchase Vouchers
  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,subtotal,taxable_amount,cgst_amount,sgst_amount,total_gst,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES
    (v_cid,'purchase','PUR/24-25/001','2024-04-02',v_led_6,'Purchase of TVs from Tata Components',76000,76000,6840,6840,13680,89680,89680,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/002','2024-04-10',v_led_7,'Purchase of ACs from Reliance Supplies',64000,64000,5760,5760,11520,75520,0,75520,'credit','active'),
    (v_cid,'purchase','PUR/24-25/003','2024-05-08',v_led_6,'Purchase of Laptops from Tata',52000,52000,4680,4680,9360,61360,61360,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/004','2024-05-20',v_led_7,'Purchase of iPhones from Reliance',270000,270000,24300,24300,48600,318600,318600,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/005','2024-06-01',v_led_6,'Purchase of Cameras from Tata',90000,90000,8100,8100,16200,106200,0,106200,'credit','active'),
    (v_cid,'purchase','PUR/24-25/006','2024-06-15',v_led_7,'Purchase of Headphones from Reliance',48000,48000,4320,4320,8640,56640,56640,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/007','2024-07-01',v_led_6,'Purchase of Tablets from Tata',56000,56000,5040,5040,10080,66080,66080,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/008','2024-07-15',v_led_7,'Purchase of Earbuds from Reliance',3000,3000,270,270,540,3540,0,3540,'credit','active'),
    (v_cid,'purchase','PUR/24-25/009','2024-08-05',v_led_6,'Purchase of Refrigerators from Tata',75000,75000,6750,6750,13500,88500,88500,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/010','2024-08-20',v_led_7,'Purchase of Air Purifiers from Reliance',17000,17000,1530,1530,3060,20060,20060,0,'bank','active'),
    (v_cid,'purchase','PUR/24-25/011','2024-09-01',v_led_6,'Purchase of OnePlus phones from Tata',110000,110000,9900,9900,19800,129800,0,129800,'credit','active'),
    (v_cid,'purchase','PUR/24-25/012','2024-09-10',v_led_7,'Purchase of Xiaomi TVs from Reliance',80000,80000,7200,7200,14400,94400,94400,0,'bank','active')
  ON CONFLICT DO NOTHING;

  -- Receipt Vouchers
  INSERT INTO vouchers (company_id,voucher_type,voucher_number,voucher_date,ledger_id,narration,grand_total,paid_amount,balance_amount,payment_mode,status) VALUES
    (v_cid,'receipt','RCT/24-25/001','2024-04-15',v_led_2,'Receipt from Anil Electronics against SAL/002',73160,73160,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/002','2024-05-10',v_led_4,'Part receipt from Mohan Trading',64520,64520,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/003','2024-06-05',v_led_5,'Receipt from Patel Distributors',80240,80240,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/004','2024-07-08',v_led_3,'Cash receipt from Sunita General Store',34220,34220,0,'cash','active'),
    (v_cid,'receipt','RCT/24-25/005','2024-08-12',v_led_1,'Receipt from Ravi Kumar & Co',247800,247800,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/006','2024-09-01',v_led_2,'Full settlement from Anil Electronics',127440,127440,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/007','2024-09-15',v_led_4,'Balance receipt from Mohan Trading',24520,24520,0,'cash','active'),
    (v_cid,'receipt','RCT/24-25/008','2024-10-03',v_led_5,'Advance from Patel Distributors',109740,109740,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/009','2024-10-20',v_led_1,'Receipt from Ravi Kumar partial',127800,127800,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/010','2024-11-05',v_led_3,'Receipt from Sunita General Store',68440,68440,0,'cash','active'),
    (v_cid,'receipt','RCT/24-25/011','2024-11-18',v_led_4,'Final settlement Mohan Trading SAL/009',135700,135700,0,'bank','active'),
    (v_cid,'receipt','RCT/24-25/012','2024-12-02',v_led_5,'Balance payment Patel Distributors',59740,59740,0,'bank','active')
  ON CONFLICT DO NOTHING;

  -- ── 9. Voucher Items ─────────────────────────────────────
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/001' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_1 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_1,'Samsung 55" 4K Smart TV','85287200',1,v_unit_pcs,45000,45000,18,9,4050,9,4050,53100)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/002' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_5 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_5,'Dell Inspiron 15 Laptop','84713010',1,v_unit_pcs,62000,62000,18,9,5580,9,5580,73160)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/003' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_8 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_8,'Boat Airdopes 441','85183000',2,v_unit_pcs,2200,4400,18,9,396,9,396,5192)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/004' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_2 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_2,'LG 1.5 Ton Inverter AC','84151090',3,v_unit_pcs,38000,114000,18,9,10260,9,10260,134520)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/005' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_9 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_9,'Lenovo Tab P12','84713090',2,v_unit_pcs,34000,68000,18,9,6120,9,6120,80240)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/006' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_3 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_3,'iPhone 15 Pro','85171300',2,v_unit_pcs,105000,210000,18,9,18900,9,18900,247800)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/007' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_6 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_6,'Canon DSLR Camera EOS','90064000',2,v_unit_pcs,54000,108000,18,9,9720,9,9720,127440)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/008' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_7 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_7,'Sony WH-1000XM5 Headphones','85183000',2,v_unit_pcs,29000,58000,18,9,5220,9,5220,68440)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/009' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_10 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_10,'Xiaomi 43" TV','85287200',5,v_unit_pcs,23000,115000,18,9,10350,9,10350,135700)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/010' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_12 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_12,'Godrej 280L Refrigerator','84181000',3,v_unit_pcs,31000,93000,18,9,8370,9,8370,109740)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/011' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_11 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_11,'Philips Air Purifier','84213990',3,v_unit_pcs,11000,33000,18,9,2970,9,2970,38940)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/012' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_4 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_4,'OnePlus 12','85171300',3,v_unit_pcs,64000,192000,18,9,17280,9,17280,226560)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/001' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_1 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_1,'Samsung 55" 4K Smart TV','85287200',2,v_unit_pcs,38000,76000,18,9,6840,9,6840,89680)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/002' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_2 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_2,'LG 1.5 Ton Inverter AC','84151090',2,v_unit_pcs,32000,64000,18,9,5760,9,5760,75520)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/003' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_5 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_5,'Dell Inspiron 15 Laptop','84713010',1,v_unit_pcs,52000,52000,18,9,4680,9,4680,61360)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/004' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_3 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_3,'iPhone 15 Pro','85171300',3,v_unit_pcs,90000,270000,18,9,24300,9,24300,318600)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/005' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_6 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_6,'Canon DSLR Camera EOS','90064000',2,v_unit_pcs,45000,90000,18,9,8100,9,8100,106200)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/006' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_7 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_7,'Sony WH-1000XM5 Headphones','85183000',2,v_unit_pcs,24000,48000,18,9,4320,9,4320,56640)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/007' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_9 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_9,'Lenovo Tab P12','84713090',2,v_unit_pcs,28000,56000,18,9,5040,9,5040,66080)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/008' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_8 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_8,'Boat Airdopes 441','85183000',2,v_unit_pcs,1500,3000,18,9,270,9,270,3540)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/009' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_12 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_12,'Godrej 280L Refrigerator','84181000',3,v_unit_pcs,25000,75000,18,9,6750,9,6750,88500)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/010' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_11 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_11,'Philips Air Purifier','84213990',2,v_unit_pcs,8500,17000,18,9,1530,9,1530,20060)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/011' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_4 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_4,'OnePlus 12','85171300',2,v_unit_pcs,55000,110000,18,9,9900,9,9900,129800)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/012' LIMIT 1;
  IF v_vou IS NOT NULL AND v_si_10 IS NOT NULL THEN
    INSERT INTO voucher_items (voucher_id,stock_item_id,item_name,hsn_code,quantity,unit_id,rate,taxable_amount,gst_percentage,cgst_percent,cgst_amount,sgst_percent,sgst_amount,total_amount)
    VALUES (v_vou,v_si_10,'Xiaomi 43" TV','85287200',4,v_unit_pcs,20000,80000,18,9,7200,9,7200,94400)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── 10. Inventory Transactions ────────────────────────────
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/001' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_1,v_vou,'out',1,45000,'2024-04-05','Sale of Samsung TV to Ravi Kumar') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/002' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_5,v_vou,'out',1,62000,'2024-04-12','Sale of Laptops to Anil Electronics') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/003' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_8,v_vou,'out',2,2200,'2024-04-20','Sale of Earbuds to Sunita Store') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/004' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_2,v_vou,'out',3,38000,'2024-05-03','Sale of AC units to Mohan Trading') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/005' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_9,v_vou,'out',2,34000,'2024-05-15','Sale of Tablets to Patel Dist') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/006' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_3,v_vou,'out',2,105000,'2024-06-02','Sale of iPhones to Ravi Kumar') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/007' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_6,v_vou,'out',2,54000,'2024-06-18','Sale of Cameras to Anil Electronics') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/008' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_7,v_vou,'out',2,29000,'2024-07-04','Sale of Headphones to Sunita Store') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/009' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_10,v_vou,'out',5,23000,'2024-07-22','Sale of TVs to Mohan Trading') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/010' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_12,v_vou,'out',3,31000,'2024-08-10','Sale of Refrigerators to Patel Dist') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/011' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_11,v_vou,'out',3,11000,'2024-08-25','Sale of Air Purifiers to Ravi Kumar') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/012' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_4,v_vou,'out',3,64000,'2024-09-05','Sale of OnePlus phones to Anil Elec') ON CONFLICT DO NOTHING;

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/001' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_1,v_vou,'in',2,38000,'2024-04-02','Purchase of TVs from Tata Components') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/002' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_2,v_vou,'in',2,32000,'2024-04-10','Purchase of ACs from Reliance Supplies') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/003' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_5,v_vou,'in',1,52000,'2024-05-08','Purchase of Laptops from Tata') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/004' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_3,v_vou,'in',3,90000,'2024-05-20','Purchase of iPhones from Reliance') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/005' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_6,v_vou,'in',2,45000,'2024-06-01','Purchase of Cameras from Tata') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/006' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_7,v_vou,'in',2,24000,'2024-06-15','Purchase of Headphones from Reliance') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/007' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_9,v_vou,'in',2,28000,'2024-07-01','Purchase of Tablets from Tata') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/008' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_8,v_vou,'in',2,1500,'2024-07-15','Purchase of Earbuds from Reliance') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/009' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_12,v_vou,'in',3,25000,'2024-08-05','Purchase of Refrigerators from Tata') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/010' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_11,v_vou,'in',2,8500,'2024-08-20','Purchase of Air Purifiers from Reliance') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/011' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_4,v_vou,'in',2,55000,'2024-09-01','Purchase of OnePlus phones from Tata') ON CONFLICT DO NOTHING;
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/012' LIMIT 1;
  INSERT INTO inventory_transactions (company_id,stock_item_id,voucher_id,transaction_type,quantity,rate,transaction_date,narration)
  VALUES (v_cid,v_si_10,v_vou,'in',4,20000,'2024-09-10','Purchase of Xiaomi TVs from Reliance') ON CONFLICT DO NOTHING;

  -- ── 11. Ledger Transactions ───────────────────────────────
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/001' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_1,v_vou,'2024-04-05',53100,0,'Sale of Samsung TV to Ravi Kumar (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-04-05',0,45000,'Sale of Samsung TV to Ravi Kumar (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/002' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_2,v_vou,'2024-04-12',73160,0,'Sale of Laptops to Anil Electronics (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-04-12',0,62000,'Sale of Laptops to Anil Electronics (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/003' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_3,v_vou,'2024-04-20',5192,0,'Sale of Earbuds to Sunita Store (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-04-20',0,4400,'Sale of Earbuds to Sunita Store (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/004' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_4,v_vou,'2024-05-03',134520,0,'Sale of AC units to Mohan Trading (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-05-03',0,114000,'Sale of AC units to Mohan Trading (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/005' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_5,v_vou,'2024-05-15',80240,0,'Sale of Tablets to Patel Dist (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-05-15',0,68000,'Sale of Tablets to Patel Dist (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/006' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_1,v_vou,'2024-06-02',247800,0,'Sale of iPhones to Ravi Kumar (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-06-02',0,210000,'Sale of iPhones to Ravi Kumar (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/007' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_2,v_vou,'2024-06-18',127440,0,'Sale of Cameras to Anil Electronics (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-06-18',0,108000,'Sale of Cameras to Anil Electronics (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/008' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_3,v_vou,'2024-07-04',68440,0,'Sale of Headphones to Sunita Store (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-07-04',0,58000,'Sale of Headphones to Sunita Store (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/009' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_4,v_vou,'2024-07-22',135700,0,'Sale of TVs to Mohan Trading (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-07-22',0,115000,'Sale of TVs to Mohan Trading (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/010' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_5,v_vou,'2024-08-10',109740,0,'Sale of Refrigerators to Patel Dist (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-08-10',0,93000,'Sale of Refrigerators to Patel Dist (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/011' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_1,v_vou,'2024-08-25',38940,0,'Sale of Air Purifiers to Ravi Kumar (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-08-25',0,33000,'Sale of Air Purifiers to Ravi Kumar (Cr Sales)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='SAL/24-25/012' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_2,v_vou,'2024-09-05',226560,0,'Sale of OnePlus phones to Anil Elec (Dr)'),
    (v_cid,v_led_sales,v_vou,'2024-09-05',0,192000,'Sale of OnePlus phones to Anil Elec (Cr Sales)');

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/001' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-04-02',0,89680,'Purchase of TVs from Tata Components (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-04-02',76000,0,'Purchase of TVs from Tata Components (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/002' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-04-10',0,75520,'Purchase of ACs from Reliance Supplies (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-04-10',64000,0,'Purchase of ACs from Reliance Supplies (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/003' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-05-08',0,61360,'Purchase of Laptops from Tata (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-05-08',52000,0,'Purchase of Laptops from Tata (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/004' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-05-20',0,318600,'Purchase of iPhones from Reliance (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-05-20',270000,0,'Purchase of iPhones from Reliance (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/005' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-06-01',0,106200,'Purchase of Cameras from Tata (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-06-01',90000,0,'Purchase of Cameras from Tata (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/006' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-06-15',0,56640,'Purchase of Headphones from Reliance (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-06-15',48000,0,'Purchase of Headphones from Reliance (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/007' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-07-01',0,66080,'Purchase of Tablets from Tata (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-07-01',56000,0,'Purchase of Tablets from Tata (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/008' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-07-15',0,3540,'Purchase of Earbuds from Reliance (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-07-15',3000,0,'Purchase of Earbuds from Reliance (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/009' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-08-05',0,88500,'Purchase of Refrigerators from Tata (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-08-05',75000,0,'Purchase of Refrigerators from Tata (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/010' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-08-20',0,20060,'Purchase of Air Purifiers from Reliance (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-08-20',17000,0,'Purchase of Air Purifiers from Reliance (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/011' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_6,v_vou,'2024-09-01',0,129800,'Purchase of OnePlus phones from Tata (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-09-01',110000,0,'Purchase of OnePlus phones from Tata (Dr Purchase)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='PUR/24-25/012' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_7,v_vou,'2024-09-10',0,94400,'Purchase of Xiaomi TVs from Reliance (Cr)'),
    (v_cid,v_led_purch,v_vou,'2024-09-10',80000,0,'Purchase of Xiaomi TVs from Reliance (Dr Purchase)');

  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/001' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-04-15',73160,0,'Receipt from Anil Electronics against SAL/002 (Dr Bank)'),
    (v_cid,v_led_2,v_vou,'2024-04-15',0,73160,'Receipt from Anil Electronics against SAL/002 (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/002' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-05-10',64520,0,'Part receipt from Mohan Trading (Dr Bank)'),
    (v_cid,v_led_4,v_vou,'2024-05-10',0,64520,'Part receipt from Mohan Trading (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/003' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-06-05',80240,0,'Receipt from Patel Distributors (Dr Bank)'),
    (v_cid,v_led_5,v_vou,'2024-06-05',0,80240,'Receipt from Patel Distributors (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/004' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-07-08',34220,0,'Cash receipt from Sunita General Store (Dr Bank)'),
    (v_cid,v_led_3,v_vou,'2024-07-08',0,34220,'Cash receipt from Sunita General Store (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/005' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-08-12',247800,0,'Receipt from Ravi Kumar & Co (Dr Bank)'),
    (v_cid,v_led_1,v_vou,'2024-08-12',0,247800,'Receipt from Ravi Kumar & Co (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/006' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-09-01',127440,0,'Full settlement from Anil Electronics (Dr Bank)'),
    (v_cid,v_led_2,v_vou,'2024-09-01',0,127440,'Full settlement from Anil Electronics (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/007' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-09-15',24520,0,'Balance receipt from Mohan Trading (Dr Bank)'),
    (v_cid,v_led_4,v_vou,'2024-09-15',0,24520,'Balance receipt from Mohan Trading (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/008' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-10-03',109740,0,'Advance from Patel Distributors (Dr Bank)'),
    (v_cid,v_led_5,v_vou,'2024-10-03',0,109740,'Advance from Patel Distributors (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/009' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-10-20',127800,0,'Receipt from Ravi Kumar partial (Dr Bank)'),
    (v_cid,v_led_1,v_vou,'2024-10-20',0,127800,'Receipt from Ravi Kumar partial (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/010' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-11-05',68440,0,'Receipt from Sunita General Store (Dr Bank)'),
    (v_cid,v_led_3,v_vou,'2024-11-05',0,68440,'Receipt from Sunita General Store (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/011' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-11-18',135700,0,'Final settlement Mohan Trading SAL/009 (Dr Bank)'),
    (v_cid,v_led_4,v_vou,'2024-11-18',0,135700,'Final settlement Mohan Trading SAL/009 (Cr Party)');
  SELECT id INTO v_vou FROM vouchers WHERE company_id=v_cid AND voucher_number='RCT/24-25/012' LIMIT 1;
  INSERT INTO ledger_transactions (company_id,ledger_id,voucher_id,transaction_date,debit_amount,credit_amount,narration) VALUES
    (v_cid,v_led_bank,v_vou,'2024-12-02',59740,0,'Balance payment Patel Distributors (Dr Bank)'),
    (v_cid,v_led_5,v_vou,'2024-12-02',0,59740,'Balance payment Patel Distributors (Cr Party)');

  RAISE NOTICE 'Seed data inserted for company_id=%', v_cid;
END $$;
