import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

/**
 * Reusable popover triggered by an icon button.
 * Usage: <Popover content={<div>...</div>} title="Help" />
 * Or:    <Popover content="Simple text" />
 */
export default function Popover({ content, title, icon: Icon = HelpCircle, iconSize = 14, className = '' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pw = 320;
    let left = rect.left + rect.width / 2 - pw / 2;
    if (left < 8) left = 8;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    let top = rect.bottom + 8;
    if (top + 200 > window.innerHeight) top = rect.top - 208;
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center justify-center rounded-full p-0.5 text-surface-500 hover:text-accent-400 hover:bg-accent-600/10 transition-colors ${className}`}
        type="button"
        aria-label="Help"
      >
        <Icon size={iconSize} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[999]" style={{ pointerEvents: 'none' }}>
          <div
            ref={popoverRef}
            className="absolute animate-fade-in"
            style={{ top: pos.top, left: pos.left, width: 320, pointerEvents: 'auto' }}
          >
            <div className="popover-card">
              {title && (
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-surface-700/40">
                  <h4 className="text-sm font-semibold text-white">{title}</h4>
                  <button onClick={() => setOpen(false)} className="text-surface-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="text-xs text-surface-300 leading-relaxed">
                {content}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Inline popover for form fields — small "?" icon with explanation.
 */
export function FieldHelp({ text, title }) {
  return <Popover content={text} title={title} iconSize={13} className="ml-1 -mt-0.5" />;
}
