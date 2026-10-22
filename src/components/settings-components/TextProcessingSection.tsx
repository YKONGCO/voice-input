// 文本处理设置区块
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Switch from '../base/Switch';

interface TextProcessingSectionProps {
  autoOptimize: boolean;
  autoCopy: boolean;
  onAutoOptimizeChange: (checked: boolean) => void;
  onAutoCopyChange: (checked: boolean) => void;
}

export function TextProcessingSection({
  autoOptimize,
  autoCopy,
  onAutoOptimizeChange,
  onAutoCopyChange,
}: TextProcessingSectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--system-purple-light)' }}
        >
          <ClipboardDocumentCheckIcon className="w-4 h-4" style={{ color: 'var(--system-purple)' }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          文本处理
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Switch
          checked={autoOptimize}
          onChange={onAutoOptimizeChange}
          label="录音结束后自动优化"
          description="开启后录音结束会先使用 LLM 优化文字"
        />
        <Switch
          checked={autoCopy}
          onChange={onAutoCopyChange}
          label="录音结束后自动复制"
          description="开启后自动复制到剪贴板"
        />
      </div>
    </div>
  );
}
