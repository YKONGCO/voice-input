import { useSettingsContext } from "../../context/SettingsContext";
import { BoltIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

interface RoleCyclerProps {
  className?: string;
}

export function RoleCycler({ className = "" }: RoleCyclerProps) {
  const { selectedRole, roles, setSelectedRole } = useSettingsContext();

  const currentIndex = roles.findIndex(r => r.id === selectedRole);

  const cycleRole = (direction: 'prev' | 'next') => {
    if (roles.length === 0) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % roles.length;
    } else {
      newIndex = (currentIndex - 1 + roles.length) % roles.length;
    }
    setSelectedRole(roles[newIndex].id);
  };

  const currentRole = roles[currentIndex] || roles[0];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {/* 角色名称在左 */}
      <div className="flex items-center gap-1">
        <BoltIcon className="w-3 h-3" style={{ color: 'var(--system-blue)' }} />
        <span
          className="text-[10px] font-medium w-14 truncate"
          style={{ color: 'var(--text-secondary)' }}
          title={currentRole?.name}
        >
          {currentRole?.name || '角色'}
        </span>
      </div>

      {/* 箭头统一放在右侧上下排列，增加间距 */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => cycleRole('prev')}
          className="w-3 h-2.5 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
          title="上一个角色"
        >
          <ChevronUpIcon className="w-2.5 h-2.5" style={{ color: 'var(--text-tertiary)' }} />
        </button>
        <button
          onClick={() => cycleRole('next')}
          className="w-3 h-2.5 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
          title="下一个角色"
        >
          <ChevronDownIcon className="w-2.5 h-2.5" style={{ color: 'var(--text-tertiary)' }} />
        </button>
      </div>
    </div>
  );
}
