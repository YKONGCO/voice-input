import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HotkeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MODIFIER_KEYS = ['Control', 'Shift', 'Alt', 'Meta'];
const EXCLUDED_KEYS = ['AltGraph', 'CapsLock', 'NumLock', 'ScrollLock', 'Tab', 'Escape'];

function formatHotkey(keys: string[]): string {
  const modifiers: string[] = [];
  let mainKey = '';

  for (const key of keys) {
    if (MODIFIER_KEYS.includes(key)) {
      modifiers.push(key === 'Control' ? 'Ctrl' : key);
    } else if (!EXCLUDED_KEYS.includes(key)) {
      mainKey = key;
    }
  }

  // Sort modifiers in a consistent order
  const order = ['Ctrl', 'Shift', 'Alt', 'Meta'];
  modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  if (mainKey) {
    return [...modifiers, mainKey].join('+');
  }
  return modifiers.join('+');
}

export default function HotkeyInput({ value, onChange, placeholder = '点击设置快捷键（可清空）' }: HotkeyInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const keysRef = useRef<string[]>([]);

  // 处理按键按下
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape 取消录制
      if (e.key === 'Escape') {
        setIsRecording(false);
        setCurrentKeys([]);
        keysRef.current = [];
        return;
      }

      // 忽略被排除的键
      if (EXCLUDED_KEYS.includes(e.key)) {
        return;
      }

      // 添加按键到列表
      if (!keysRef.current.includes(e.key)) {
        keysRef.current = [...keysRef.current, e.key];
        setCurrentKeys([...keysRef.current]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  // 处理按键释放
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // 释放前的按键列表（用于判断）
      const keysBeforeRelease = [...keysRef.current];

      // 检查这个键是否在当前按键列表中
      const wasInKeys = keysBeforeRelease.includes(e.key);

      // 从列表中移除该键
      keysRef.current = keysRef.current.filter(k => k !== e.key);
      setCurrentKeys([...keysRef.current]);

      // 检查之前是否有主键，现在主键被释放了
      const hadMainKey = wasInKeys && !MODIFIER_KEYS.includes(e.key);
      const hasMainKeyNow = keysRef.current.some(k => !MODIFIER_KEYS.includes(k));

      // 如果之前有主键，现在主键被释放了，则保存快捷键
      if (hadMainKey && !hasMainKeyNow) {
        // 只允许组合键（至少2个键）
        const hasModifier = keysBeforeRelease.some(k => MODIFIER_KEYS.includes(k));
        if (keysBeforeRelease.length >= 2 || hasModifier) {
          const formatted = formatHotkey(keysBeforeRelease);
          if (formatted) {
            onChange(formatted);
          }
        }
        setIsRecording(false);
        keysRef.current = [];
        setCurrentKeys([]);
      }

      // 如果没有主键了（只剩下修饰键），也需要保存
      // 处理只按修饰键的情况（如只按 Ctrl），但同样要求至少2个键
      const wasModifierOnly = keysBeforeRelease.length > 0 &&
        keysBeforeRelease.every(k => MODIFIER_KEYS.includes(k));
      if (wasModifierOnly && keysRef.current.length === 0) {
        // 只允许2个及以上修饰键组合（如 Ctrl+Shift）
        if (keysBeforeRelease.length >= 2) {
          const formatted = formatHotkey(keysBeforeRelease);
          if (formatted) {
            onChange(formatted);
          }
        }
        setIsRecording(false);
        setCurrentKeys([]);
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [isRecording, onChange, currentKeys]);

  const handleClick = () => {
    if (!isRecording) {
      setIsRecording(true);
      setCurrentKeys([]);
      keysRef.current = [];
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const displayText = isRecording
    ? (currentKeys.length > 0 ? formatHotkey(currentKeys) + '...' : '按下快捷键...')
    : (value || placeholder);

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isRecording
          ? 'ring-2 ring-(--system-blue) bg-(--system-blue-light)'
          : 'bg-(--surface-primary) hover:bg-(--role-hover-bg)'
      }`}
      style={{
        border: '0.5px solid var(--border-secondary)',
      }}
    >
      <span
        className="text-[13px] flex-1 truncate"
        style={{
          color: isRecording || value ? 'var(--text-primary)' : 'var(--text-tertiary)',
        }}
      >
        {displayText}
      </span>
      {value && !isRecording && (
        <button
          onClick={handleClear}
          className="ml-2 p-0.5 rounded hover:bg-(--role-hover-bg) transition-colors"
          title="清除"
        >
          <XMarkIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
        </button>
      )}
    </div>
  );
}
