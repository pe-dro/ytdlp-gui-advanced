export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-surface-300 tracking-wide uppercase">{label}</label>
      {children}
      {hint && <p className="text-xs text-surface-500">{hint}</p>}
    </div>
  );
}

export function Row({ children, className = '' }) {
  return <div className={`grid grid-cols-2 gap-3 ${className}`}>{children}</div>;
}

export function Toggle({ checked, onChange, label, hint, id }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div>
        <p className="text-sm text-surface-200">{label}</p>
        {hint && <p className="text-xs text-surface-500 mt-0.5">{hint}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500/40 ${
          checked ? 'bg-accent-600' : 'bg-surface-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

export function Select({ value, onChange, options, id }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input appearance-none cursor-pointer bg-surface-800/80"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Input({ value, onChange, placeholder, id, type = 'text', ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input"
      {...rest}
    />
  );
}

export function NumberInput({ value, onChange, min, max, id }) {
  return (
    <input
      id={id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      max={max}
      className="input"
    />
  );
}
