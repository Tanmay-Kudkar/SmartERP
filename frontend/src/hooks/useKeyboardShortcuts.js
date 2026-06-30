import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useStore();

  const track = (kbd) => {
    const state = useStore.getState();
    if (state.activeCompany?.id && state.trackShortcut) {
      state.trackShortcut(state.activeCompany.id, kbd);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase() || '';
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;

      // Prevent default browser/system behavior for conflicting shortcuts
      const lowKey = e.key.toLowerCase();
      if (['f1', 'f3', 'f6', 'f10'].includes(lowKey)) {
        e.preventDefault();
      }
      if (e.ctrlKey) {
        const conflicts = ['h', 's', 'p', 'b', 'd', 'k', 'f', 'q', 'c', 'v', 'm'];
        if (conflicts.includes(lowKey)) {
          // Allow copy and paste standard browser shortcuts inside inputs
          if (isInput && ['c', 'v'].includes(lowKey)) {
            // Let native copy/paste happen
          } else {
            e.preventDefault();
          }
        }
      }
      if (e.altKey && ['l', 'a', 'g', 's', 'u', 'b', 'p', 't', 'c', 'r', 'x', 'f8', 'f9'].includes(lowKey)) {
        e.preventDefault();
      }

      // Application shortcuts are now allowed on the Shortcuts Guide page.

      const isModalOpen = !!(
        document.querySelector('[data-alert-modal="true"]') ||
        document.querySelector('[data-fy-modal="true"]') ||
        document.querySelector('[data-palette-open="true"]') ||
        document.querySelector('[data-calculator-open="true"]') ||
        document.querySelector('.modal-overlay')
      );

      if (isModalOpen) {
        if (e.key === 'Escape') {
          // Allow Escape to fall through
        } else if (e.key === 'Enter') {
          const alertCloseBtn = document.querySelector('[data-alert-modal="true"] button');
          if (alertCloseBtn) {
            e.preventDefault();
            alertCloseBtn.click();
            return;
          }
          // Allow other Enter/Ctrl+Enter keys to fall through
        } else {
          // Block modifier shortcuts and function keys
          if (e.ctrlKey || e.altKey || e.key.startsWith('F')) {
            e.preventDefault();
            return;
          }
          // Block non-input text keypresses
          if (!isInput) {
            e.preventDefault();
            return;
          }
        }
      }

      // Block contextual shortcuts from triggering on the shortcuts guide page
      const isShortcutsPage = location.pathname === '/shortcuts';
      if (isShortcutsPage) {
        const key = e.key.toLowerCase();
        if (
          (e.ctrlKey && key === 'e') ||
          (e.ctrlKey && key === 'd') ||
          (e.ctrlKey && key === 'p') ||
          (e.ctrlKey && key === 'm') ||
          (e.ctrlKey && e.key === 'Enter')
        ) {
          e.preventDefault();
          return;
        }
      }

      // ======================================================
      // 1. Global Shortcuts (Work even inside input fields)
      // ======================================================
      if (e.ctrlKey && e.key.toLowerCase() === 'q') { e.preventDefault(); logout(); navigate('/login'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'h') { e.preventDefault(); track('Ctrl+H'); navigate('/dashboard'); return; }
      if (e.key === 'F1') { e.preventDefault(); track('F1'); navigate('/companies'); return; }
      if (e.key === 'F2') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-fy-modal'));
        return;
      }
      if (e.key === 'F3') { e.preventDefault(); navigate('/companies'); return; }
      if (e.key === 'F4') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-calculator'));
        return;
      }
      if (e.key === 'F5') { e.preventDefault(); window.location.reload(); return; }
      if (e.key === 'Escape') {
        const alertCloseBtn = document.querySelector('[data-alert-modal="true"] button, .modal-overlay button.btn-secondary, .modal-overlay button');
        const calcOpen = document.querySelector('[data-calculator-open="true"]');
        const paletteOpen = document.querySelector('[data-palette-open="true"]');
        const fyOpen = document.querySelector('[data-fy-modal="true"]');
        
        if (alertCloseBtn) {
          e.preventDefault();
          alertCloseBtn.click();
          return;
        }
        if (fyOpen) {
          e.preventDefault();
          const fyClose = fyOpen.querySelector('button.btn-secondary, button');
          if (fyClose) fyClose.click();
          return;
        }
        if (!calcOpen && !paletteOpen) {
          e.preventDefault();
          navigate(-1);
        }
        return;
      }
      
      // Form actions (work even inside inputs)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.querySelector('button[type="submit"], button.btn-success, .btn-success');
        if (submitBtn) {
          submitBtn.click();
        } else {
          toast.error('No form to submit');
        }
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const cancelBtn = document.querySelector('.btn-secondary');
        if (cancelBtn) {
          cancelBtn.click();
        } else {
          navigate(-1);
        }
        return;
      }

      // Search & Command Palette
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"], input[type="search"], .erp-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          toast.error('No search field found on this page');
        }
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        track('Ctrl+K');
        window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        track('Ctrl+K');
        window.dispatchEvent(new CustomEvent('toggle-command-palette'));
        return;
      }

      // If typing in input, don't trigger navigation/page/table shortcuts
      if (isInput) return;

      // ======================================================
      // 2. Row Actions via keyboard (Non-input only)
      // Arrow Up/Down is handled by useSpatialNavigation.
      // Enter activates the currently focused button.
      // ======================================================
      if (e.key === 'Enter') {
        // If a button/link already has focus, let the browser handle it natively
        const focused = document.activeElement;
        if (focused && (focused.tagName === 'BUTTON' || focused.tagName === 'A')) {
          // Native enter on button/link works already — no action needed
          return;
        }
        // Fallback: click first action button in the nearest focused row
        const focusedRow = focused?.closest('tr');
        if (focusedRow) {
          e.preventDefault();
          const actionBtn = focusedRow.querySelector('a, button[title="View"], button[title="Edit"], button');
          if (actionBtn) actionBtn.click();
          return;
        }
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const focusedRow = document.activeElement?.closest('tr');
        if (focusedRow) {
          const editBtn = focusedRow.querySelector('button[title="Edit"], a[href*="edit"]');
          if (editBtn) editBtn.click();
          else toast.error('Edit action not available for this item');
        } else {
          toast.error('Focus a row first using Up/Down arrow keys');
        }
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const focusedRow = document.activeElement?.closest('tr');
        if (focusedRow) {
          const deleteBtn = focusedRow.querySelector('button[title="Delete"], button[title="Cancel"]');
          if (deleteBtn) deleteBtn.click();
          else toast.error('Delete/Cancel action not available for this item');
        } else {
          toast.error('Focus a row first using Up/Down arrow keys');
        }
        return;
      }

      // ======================================================
      // 3. Masters Shortcuts
      // ======================================================
      if (e.altKey && e.key.toLowerCase() === 'l') { e.preventDefault(); track('Alt+L'); navigate('/ledgers/new'); return; }
      if (e.altKey && e.key.toLowerCase() === 'a') { e.preventDefault(); track('Alt+A'); navigate('/ledgers'); return; }
      if (e.altKey && e.key.toLowerCase() === 'g') { e.preventDefault(); toast('Create Ledger Group coming soon!', { icon: '📂' }); return; }
      if (e.altKey && e.key.toLowerCase() === 's') { e.preventDefault(); track('Alt+S'); navigate('/stock/items/new'); return; }
      if (e.altKey && e.key.toLowerCase() === 'u') { 
        e.preventDefault(); 
        navigate('/stock/units?new=true'); 
        window.dispatchEvent(new CustomEvent('open-unit-form'));
        return; 
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'i') { e.preventDefault(); track('Ctrl+I'); navigate('/stock/items'); return; }

      // ======================================================
      // 4. Voucher Shortcuts
      // ======================================================
      if (e.key === 'F6') { e.preventDefault(); toast('Receipt Voucher creation coming soon!', { icon: '🧾' }); return; }
      if (e.key === 'F7') { e.preventDefault(); toast('Journal Voucher creation coming soon!', { icon: '📓' }); return; }
      if (e.key === 'F8') { e.preventDefault(); track('F8'); navigate('/vouchers/sales/new'); return; }
      if (e.key === 'F9') { e.preventDefault(); track('F9'); navigate('/vouchers/purchase/new'); return; }
      if (e.key === 'F10') { e.preventDefault(); toast('Reversing Journal coming soon!', { icon: '🔄' }); return; }
      if (e.altKey && e.key === 'F8') { e.preventDefault(); toast('Credit Note coming soon!', { icon: '💳' }); return; }
      if (e.altKey && e.key === 'F9') { e.preventDefault(); toast('Debit Note coming soon!', { icon: '💳' }); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); navigate('/vouchers'); return; }

      // ======================================================
      // 5. Inventory Shortcuts
      // ======================================================
      if (e.ctrlKey && e.key.toLowerCase() === 'i') { e.preventDefault(); navigate('/stock/items'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); navigate('/stock/items/new'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); toast('Stock Transfer coming soon!', { icon: '🚚' }); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'r') { e.preventDefault(); navigate('/reports?tab=stock'); return; }

      // ======================================================
      // 6. Billing Shortcuts
      // ======================================================
      if (e.ctrlKey && e.key.toLowerCase() === 'b') { e.preventDefault(); navigate('/vouchers/sales/new'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'p' && !e.shiftKey) { e.preventDefault(); window.print(); return; }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); window.print(); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'm') { e.preventDefault(); toast.success('Emailing Invoice PDF...'); return; }

      // ======================================================
      // 7. Customer & Supplier Shortcuts
      // ======================================================
      if (e.ctrlKey && e.key.toLowerCase() === 'c' && !e.shiftKey) { e.preventDefault(); navigate('/ledgers/new?type=customer'); return; }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); navigate('/ledgers?type=customer'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 's' && !e.shiftKey) { e.preventDefault(); navigate('/ledgers/new?type=supplier'); return; }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); navigate('/ledgers?type=supplier'); return; }

      // ======================================================
      // 8. Reports Shortcuts
      // ======================================================
      if (e.altKey && e.key.toLowerCase() === 'b') { e.preventDefault(); navigate('/reports?tab=financials'); return; }
      if (e.altKey && e.key.toLowerCase() === 'p') { e.preventDefault(); navigate('/reports?tab=financials'); return; }
      if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); navigate('/reports?tab=ledgers'); return; }
      if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); navigate('/reports?tab=financials'); return; }
      if (e.altKey && e.key.toLowerCase() === 'r') { e.preventDefault(); navigate('/reports?tab=stock'); return; }
      if (e.altKey && e.key.toLowerCase() === 'x') { e.preventDefault(); navigate('/reports?tab=financials'); return; }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, logout]);
};
