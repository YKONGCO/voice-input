interface LabelInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "url";
}

export default function LabelInput({
  label,
  value,
  onChange,
  placeholder = "请输入",
  type = "text",
}: LabelInputProps) {
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[13px] border"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-secondary)",
          color: "var(--text-primary)",
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
