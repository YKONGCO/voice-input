interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export default function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <span
              className="text-[13px] font-medium block"
              style={{ color: 'var(--text-primary)' }}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className="text-[11px] block"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        title={label || "Toggle switch"}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-(--system-blue)' : 'bg-(--border-secondary)'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </button>
    </div>
  );
}
