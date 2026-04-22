import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Section({ title, icon: Icon, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass overflow-hidden animate-slide-up">
      <button
        className="section-header group"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className={`p-1.5 rounded-lg ${open ? 'bg-accent-600/20 text-accent-400' : 'bg-surface-700/60 text-surface-400 group-hover:text-surface-200'} transition-colors`}>
              <Icon size={15} />
            </span>
          )}
          <span className="text-sm font-semibold text-surface-100">{title}</span>
          {badge && <span className="badge-blue">{badge}</span>}
        </div>
        <ChevronDown
          size={16}
          className={`text-surface-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}
