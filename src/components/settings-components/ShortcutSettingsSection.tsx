// 快捷键设置区块
import { CommandLineIcon } from '@heroicons/react/24/outline';
import Switch from '../base/Switch';
import HotkeyInput from '../base/HotkeyInput';

interface ShortcutSettingsSectionProps {
  globalShortcut: string;
  toggleShortcut: string;
  autoVoiceRecognition: boolean;
  onGlobalShortcutChange: (value: string) => void;
  onToggleShortcutChange: (value: string) => void;
  onAutoVoiceRecognitionChange: (checked: boolean) => void;
}

export function ShortcutSettingsSection({
  globalShortcut,
  toggleShortcut,
  autoVoiceRecognition,
  onGlobalShortcutChange,
  onToggleShortcutChange,
  onAutoVoiceRecognitionChange,
}: ShortcutSettingsSectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--system-cyan-light)' }}
        >
          <CommandLineIcon className="w-4 h-4" style={{ color: 'var(--system-cyan)' }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          快捷键设置
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              全局快捷键
            </span>
          </div>
          <HotkeyInput
            value={globalShortcut}
            onChange={onGlobalShortcutChange}
          />
          <div className="mt-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {autoVoiceRecognition ? '显示窗口并自动录音' : '显示窗口'}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              切换录音
            </span>
          </div>
          <HotkeyInput
            value={toggleShortcut}
            onChange={onToggleShortcutChange}
          />
        </div>
        <Switch
          checked={autoVoiceRecognition}
          onChange={onAutoVoiceRecognitionChange}
          label="全局快捷键自动录音"
          description="快捷键显示窗口时自动开始录音"
        />
      </div>
    </div>
  );
}
