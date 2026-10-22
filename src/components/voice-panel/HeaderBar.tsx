// VoicePanel 头部栏
import { useCallback } from 'react';
import {
  MinusIcon,
  XMarkIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useWindowControls } from '../../hooks/useWindowControls';
import { StatusIndicator } from '../base/StatusIndicator';
import { RoleDropdown } from '../base/RoleDropdown';
import { RecordingState } from '../../types';

interface HeaderBarProps {
  recordingState: RecordingState;
  isOptimizing: boolean;
  statusMessage: { text: string; type: 'error' | 'success' } | null;
  isPinned: boolean;
  onCompact: () => void;
  onSettingsClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  togglePin: (e?: React.MouseEvent) => void;
}

export function HeaderBar({
  recordingState,
  isOptimizing,
  statusMessage,
  isPinned,
  onCompact,
  onSettingsClick,
  onMouseDown,
  togglePin,
}: HeaderBarProps) {
  const { closeWindow, minimizeWindow } = useWindowControls();

  const handleClose = useCallback((e: React.MouseEvent) => {
    closeWindow(e);
  }, [closeWindow]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    minimizeWindow(e);
  }, [minimizeWindow]);

  return (
    <div
      className="bg-(--surface-primary) border-b border-(--border-secondary) drag-region rounded-xl"
      style={{ height: '14%' }}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between h-full px-3">
        {/* 左侧状态和角色下拉框 */}
        <div className="flex items-center gap-2">
          {statusMessage ? (
            <span
              className="text-[9px] font-medium"
              style={{ color: statusMessage.type === 'error' ? 'var(--system-red)' : 'var(--system-green)' }}
            >
              {statusMessage.text}
            </span>
          ) : (
            <StatusIndicator
              recordingState={recordingState}
              isOptimizing={isOptimizing}
              showText={false}
            />
          )}
          <RoleDropdown />
        </div>

        {/* 右侧控制按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onCompact}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title="缩小"
          >
            <ArrowsPointingInIcon className="w-4 h-4" style={{ color: 'var(--gray-2)' }} />
          </button>
          <button
            onClick={onSettingsClick}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title="设置"
          >
            <Cog6ToothIcon className="w-4 h-4" style={{ color: 'var(--gray-2)' }} />
          </button>
          <button
            onClick={togglePin}
            className={`w-4 h-4 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag ${isPinned ? 'bg-(--role-hover-bg)' : ''}`}
            title={isPinned ? "取消置顶" : "置顶窗口"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isPinned ? 'rotate-45' : ''}`}
              style={{ color: isPinned ? 'var(--system-blue)' : 'var(--gray-2)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={handleMinimize}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title="最小化"
          >
            <MinusIcon className="w-4 h-4" style={{ color: 'var(--gray-2)' }} />
          </button>
          <button
            onClick={handleClose}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title="关闭"
          >
            <XMarkIcon className="w-4 h-4" style={{ color: 'var(--gray-2)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
