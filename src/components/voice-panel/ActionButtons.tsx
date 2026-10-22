// VoicePanel 底部操作栏
import {
  SparklesIcon,
  TrashIcon,
  MicrophoneIcon,
  StopIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  Square2StackIcon,
} from '@heroicons/react/24/outline';
import { RecordingState } from '../../types';

interface ActionButtonsProps {
  editText: string;
  finalText: string;
  interimText: string;
  recordingState: RecordingState;
  isOptimizing: boolean;
  isRecordingDisabled: boolean;
  copied: boolean;
  onOptimize: () => void;
  onDelete: () => void;
  onToggleRecording: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function ActionButtons({
  editText,
  finalText,
  interimText,
  recordingState,
  isOptimizing,
  isRecordingDisabled,
  copied,
  onOptimize,
  onDelete,
  onToggleRecording,
  onCopy,
  onPaste,
}: ActionButtonsProps) {
  const hasContent = editText.trim() || finalText || interimText;
  const isRecording = recordingState === 'recording';

  return (
    <div className="flex items-center justify-between" style={{ height: '16%' }}>
      {/* 左侧：润色+删除 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOptimize}
          disabled={isOptimizing || !editText.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all no-drag disabled:opacity-30 hover:brightness-90"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
          }}
          title="使用当前角色优化文本"
        >
          {isOptimizing ? (
            <div className="w-5 h-5 border-2 border-(--system-purple) border-t-transparent rounded-full animate-spin" />
          ) : (
            <SparklesIcon className="w-5 h-5" style={{ color: 'var(--system-purple)' }} />
          )}
        </button>

        <button
          onClick={onDelete}
          disabled={!hasContent}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all no-drag disabled:opacity-30 hover:brightness-90"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
          }}
          title="清空文本"
        >
          <TrashIcon className="w-5 h-5" style={{ color: 'var(--system-red)' }} />
        </button>
      </div>

      {/* 中间：录音按钮 */}
      <div className="flex items-center justify-center">
        <button
          onClick={onToggleRecording}
          disabled={isRecordingDisabled}
          className={`flex items-center justify-center rounded-full transition-all no-drag shadow-md ${
            isRecordingDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            width: '44px',
            height: '44px',
            backgroundColor: isRecording ? 'var(--system-red)' : 'var(--system-blue)',
            color: 'var(--text-on-primary)',
            boxShadow: isRecording ? '0 0 20px var(--system-red)' : 'var(--shadow-md)',
          }}
          title={getRecordingButtonTitle(recordingState, isOptimizing)}
        >
          {isRecording ? (
            <StopIcon className="w-5 h-5" />
          ) : (
            <MicrophoneIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 右侧：复制+粘贴 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCopy}
          disabled={!editText.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all no-drag disabled:opacity-30 hover:brightness-90"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
          }}
          title="复制到剪贴板"
        >
          {copied ? (
            <ClipboardDocumentCheckIcon className="w-5 h-5" style={{ color: 'var(--system-green)' }} />
          ) : (
            <ClipboardDocumentIcon className="w-5 h-5" style={{ color: 'var(--system-blue)' }} />
          )}
        </button>

        <button
          onClick={onPaste}
          disabled={!editText.trim()}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all no-drag disabled:opacity-30 hover:brightness-90"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-secondary)',
          }}
          title="粘贴到目标应用"
        >
          <Square2StackIcon className="w-5 h-5" style={{ color: 'var(--system-blue)' }} />
        </button>
      </div>
    </div>
  );
}

function getRecordingButtonTitle(recordingState: RecordingState, isOptimizing: boolean): string {
  if (isOptimizing) return '优化中...';
  switch (recordingState) {
    case 'recording': return '停止 (Esc)';
    case 'processing': return '处理中...';
    case 'speaking': return '播放中...';
    default: return '开始录音 (F1)';
  }
}
