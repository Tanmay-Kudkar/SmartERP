import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function YearSelectInput({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempYear, setTempYear] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    setTempYear(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('button')) return;
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    if (tempYear >= 1800 && tempYear <= 2100) {
      onChange(tempYear);
      setIsOpen(false);
    } else {
      toast.error("Year must be between 1800 and 2100");
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={ref}>
      <div 
        className="erp-input" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--bg-secondary)', width: '100%' }}
        onClick={() => {
          setTempYear(value);
          setIsOpen(!isOpen);
        }}
      >
        <span>1st April {value} to 31st March {value + 1}</span>
        <Calendar size={16} color="var(--text-muted)" />
      </div>

      {isOpen && (
        <div className="animate-fade-in" style={{ position: 'absolute', bottom: '100%', left: 0, minWidth: '220px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-blue)', borderRadius: '8px', padding: '0.875rem', marginBottom: '0.5rem', zIndex: 50, boxShadow: '0 -10px 25px rgba(0,0,0,0.4)', width: '100%' }}>
          <label className="erp-label">Enter Start Year (1800 - 2100)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              data-year-popover-input="true"
              type="number" 
              min="1800" max="2100" 
              className="erp-input" 
              style={{ flex: 1, minWidth: '100px', background: 'var(--bg-card)' }}
              value={tempYear} 
              onChange={e => setTempYear(parseInt(e.target.value) || '')} 
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
