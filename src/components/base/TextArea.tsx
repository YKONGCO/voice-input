interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function TextArea({
  value,
  onChange,
  placeholder = "请输入",
  minHeight = "80px",
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-[13px] border resize-none"
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-secondary)",
        color: "var(--text-primary)",
        minHeight,
      }}
      placeholder={placeholder}
    />
  );
}
