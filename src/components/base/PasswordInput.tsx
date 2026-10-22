import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function PasswordInput({
  value,
  onChange,
  label,
  placeholder = "请输入",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="text-[12px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div className="relative flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          className="flex-1 px-3 py-2 pr-8 rounded-lg text-[13px] border"
          style={{
            backgroundColor: "var(--surface-primary)",
            borderColor: "var(--border-secondary)",
            color: "var(--text-primary)",
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 p-0.5 rounded hover:bg-black/5"
          style={{ color: "var(--text-tertiary)" }}
        >
          {showPassword ? (
            <EyeSlashIcon className="w-4 h-4" />
          ) : (
            <EyeIcon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
