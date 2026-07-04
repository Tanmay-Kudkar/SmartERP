import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) {
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
      }}
      onClick={onCancel}
    >
      <div 
        className="glass-card animate-slide-up"
        style={{ width: '100%', maxWidth: '420px', overflow: 'hidden', padding: 0 }}
        onClick={e => e.stopPropagation()} // prevent click from closing
      >
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: variant === 'danger' ? '#f87171' : '#60a5fa', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', letterSpacing: '0.01em' }}>{title}</h3>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', fontWeight: '500', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={onCancel}
            className="btn-secondary"
            style={{ fontWeight: '600', padding: '0.5rem 1.25rem' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            autoFocus
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            style={{ fontWeight: '600', padding: '0.5rem 1.25rem' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
