import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select...", 
  style = {}, 
  className = "",
  disabled = false,
  innerStyle = {},
  searchable = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = isOpen && searchable ? searchTerm : (selectedOption ? selectedOption.label : '');

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 9999,
        });
      }
    };
    
    updatePosition();

    const handleScroll = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setIsOpen(false);
      setSearchTerm('');
    };
    
    const handleClickOutside = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll, true);
    };
  }, [isOpen]);

  const filteredOptions = searchable 
    ? options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%', ...style }} 
      className={className}
    >
      <div 
        className={clsx("erp-select", { "focus-ring": isOpen })}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '0.5rem',
          cursor: disabled ? 'not-allowed' : (searchable ? 'text' : 'pointer'),
          opacity: disabled ? 0.6 : 1,
          border: isOpen ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          backgroundColor: isOpen ? 'var(--bg-primary)' : 'var(--bg-secondary)',
          backgroundSize: '0', // Hide native chevron background
          padding: '0.4rem 0.75rem',
          minHeight: '34px',
          ...innerStyle
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (searchable) inputRef.current?.focus();
          }
        }}
      >
        {searchable ? (
          <input
            ref={inputRef}
            value={displayValue}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, minWidth: 0, textOverflow: 'ellipsis', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          />
        ) : (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
        <ChevronDown size={14} style={{ flexShrink: 0, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && !disabled && createPortal(
        <div 
          ref={dropdownRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="glass-card animate-fade-in"
          style={{ 
            ...dropdownStyle,
            maxHeight: '250px', 
            overflowY: 'auto',
            padding: '4px',
            backgroundColor: 'var(--bg-primary)',
            backdropFilter: 'blur(10px)',
            border: '2px solid var(--accent-blue)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            borderRadius: '8px'
          }}
        >
          {filteredOptions.length > 0 ? filteredOptions.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="custom-select-option"
                style={{
                  background: 'transparent',
                  color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                  fontWeight: isSelected ? '600' : '400'
                }}
              >
                {opt.render ? opt.render() : opt.label}
              </div>
            );
          }) : (
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>No results found</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
