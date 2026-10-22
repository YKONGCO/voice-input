import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, BoltIcon } from "@heroicons/react/24/outline";
import { useSettingsContext } from "../../context/SettingsContext";

interface RoleDropdownProps {
  className?: string;
  buttonClassName?: string;
}

export function RoleDropdown({ className = "", buttonClassName = "" }: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { selectedRole, roles, setSelectedRole } = useSettingsContext();

  const currentRole = roles.find(r => r.id === selectedRole) ||
    (roles.length > 0 ? roles[0] : null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-(--role-hover-bg) transition-colors no-drag ${buttonClassName}`}
      >
        <BoltIcon
          className="w-3.5 h-3.5"
          style={{ color: 'var(--system-blue)' }}
        />
        <span
          className="text-[11px] font-medium max-w-20 truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {currentRole?.name || '文字润色'}
        </span>
        <ChevronDownIcon
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && roles.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-50 min-w-35 max-h-50 overflow-y-auto scrollbar-none no-drag"
          style={{
            backgroundColor: 'var(--surface-primary)',
            border: 'var(--versus-border-subtle)',
          }}
        >
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id)}
              className={`w-full px-3 py-2 text-left text-[11px] flex flex-col gap-0.5 hover:bg-(--role-hover-bg) transition-colors no-drag ${
                selectedRole === role.id ? 'bg-(--role-hover-bg)' : ''
              }`}
            >
              <span
                className="font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {role.name}
              </span>
              <span
                className="truncate"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {role.desc}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
