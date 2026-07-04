import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles = {
  '/': 'SmartERP | Business Management',
  '/login': 'Login | SmartERP',
  '/register': 'Register | SmartERP',
  '/companies': 'Select Company | SmartERP',
  '/dashboard': 'Dashboard | SmartERP',
  '/ledgers': 'Ledgers | SmartERP',
  '/ledgers/new': 'Create Ledger | SmartERP',
  '/stock/items': 'Stock Items | SmartERP',
  '/stock/items/new': 'Create Stock Item | SmartERP',
  '/stock/units': 'Units | SmartERP',
  '/vouchers': 'Voucher Log | SmartERP',
  '/vouchers/sales/new': 'New Sales Voucher | SmartERP',
  '/vouchers/purchase/new': 'New Purchase Voucher | SmartERP',
  '/reports': 'Reports | SmartERP',
  '/shortcuts': 'Keyboard Shortcuts | SmartERP',
};

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    let title = routeTitles[location.pathname];
    
    // Fallback for dynamic ID routes
    if (!title) {
      if (location.pathname.match(/\/ledgers\/\d+\/edit/)) title = 'Edit Ledger | SmartERP';
      else if (location.pathname.match(/\/stock\/items\/\d+\/edit/)) title = 'Edit Stock Item | SmartERP';
      else if (location.pathname.match(/\/vouchers\/\d+\/view/)) title = 'Invoice | SmartERP';
    }

    document.title = title || 'SmartERP';
  }, [location.pathname]);

  return null;
}
