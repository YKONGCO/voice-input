import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  allowCustom?: boolean;
}

export default function SelectInput({
  value,
  onChange,
  options,
  placeholder = "请选择",
  allowCustom = true,
}: SelectInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // 同步外部值变化
  useEffect(() => {
    const matchedOption = options.find((opt) => opt.value === value);
    if (matchedOption) {
      setCustomInput("");
    }
  }, [value, options]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = options.find((opt) => opt.value === value);
  const displayValue = currentOption ? currentOption.label : value;
  const isCustomValue = !options.some((opt) => opt.value === value);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setCustomInput("");
    setShowDropdown(false);
  };

  const handleAddCustom = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setCustomInput("");
      setShowDropdown(false);
    }
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCustom();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 显示当前选中值 */}
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-3 py-2 rounded-lg text-[13px] border cursor-pointer flex items-center justify-between"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-secondary)",
          color: "var(--text-primary)",
          minHeight: "38px",
        }}
      >
        <span className={!value ? "opacity-50" : ""}>
          {displayValue || placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          style={{ color: "var(--text-tertiary)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* 下拉菜单 */}
      {showDropdown && (
        <div
          className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg"
          style={{
            backgroundColor: "var(--surface-primary)",
            borderColor: "var(--border-secondary)",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          {/* 自定义输入框 */}
          {allowCustom && (
            <div className="p-2" style={{ borderBottom: "0.5px solid var(--border-secondary)" }}>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleCustomInputKeyDown}
                className="w-full px-2 py-1.5 rounded text-[13px] border"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-primary)",
                }}
                placeholder="自定义..."
                autoFocus
              />
            </div>
          )}

          {/* 选项列表 */}
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 text-[13px] cursor-pointer transition-colors"
              style={{
                color: value === option.value ? "var(--system-blue)" : "var(--text-primary)",
                backgroundColor: value === option.value ? "var(--system-blue-light)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = "var(--role-hover-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {option.label}
            </div>
          ))}

          {/* 当前自定义值显示 */}
          {allowCustom && isCustomValue && (
            <div
              className="px-3 py-2 text-[13px]"
              style={{
                color: "var(--text-tertiary)",
                borderTop: "0.5px solid var(--border-secondary)",
              }}
            >
              当前: {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
