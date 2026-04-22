import { useRef, useEffect } from 'react';
import { Terminal, X, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TYPE_COLORS = {
  info:    'text-surface-400',
  success: 'text-success-400',
  error:   'text-danger-400',
  warn:    'text-warning-400',
  cmd:     'text-accent-400',
};

export default function Console() {
  const { state, actions } = useApp();
  const bottomRef = useRef(null);

  useEffect(() => {
    if (state.consoleOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.consoleLogs, state.consoleOpen]);

  return (
    <div
      className={`border-t border-surface-800/60 bg-surface-950 transition-all duration-300 overflow-hidden flex flex-col ${
        state.consoleOpen ? 'h-56' : 'h-8'
      }`}
    >
      {/* Header */}
      <div
        onClick={actions.toggleConsole}
        className="flex items-center justify-between px-3 h-8 cursor-pointer hover:bg-surface-800/30 transition-colors shrink-0"
      >
        <div className="flex items-center gap-2 text-xs text-surface-400">
          <Terminal size={13} />
          <span className="font-medium">Live Console</span>
          <span className="text-surface-600">({state.consoleLogs.length} lines)</span>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            id="btn-clear-console"
            onClick={actions.clearConsole}
            className="btn-icon p-1"
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={actions.toggleConsole}
            className="btn-icon p-1"
            title="Toggle"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${state.consoleOpen ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      {/* Log area */}
      {state.consoleOpen && (
        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono space-y-0.5">
          {state.consoleLogs.length === 0 ? (
            <p className="text-surface-600 text-xs italic">No output yet…</p>
          ) : (
            state.consoleLogs.map((log) => (
              <div key={log.id} className={`console-line ${TYPE_COLORS[log.type] || 'text-surface-400'}`}>
                {log.text}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
