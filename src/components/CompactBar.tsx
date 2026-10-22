// CompactBar - 紧凑模式
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  MicrophoneIcon,
  StopIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSettingsContext } from "../context/SettingsContext";
import { copyToClipboard } from "../utils/clipboard";
import { UI_CONSTANTS } from "../constants/ui";
import { RoleCycler } from "./base/RoleCycler";
import { StatusIndicator } from "./base/StatusIndicator";
import { VoiceOverlay } from "./base/VoiceOverlay";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useWindowControls } from "../hooks/useWindowControls";
import { useVoiceEvents } from "../hooks/useVoiceEvents";

interface CompactBarProps {
  onSwitchToFull: () => void;
}

export default function CompactBar({ onSwitchToFull }: CompactBarProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editText, setEditText] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const { setWindowSize, togglePin, isPinned } = useWindowControls();
  const { settings } = useSettingsContext();

  const {
    recordingState,
    interimText,
    finalText,
    isProcessing,
    startRecording,
    stopRecording,
    resetText,
  } = useSpeechRecognition({
    autoOptimizeEnabled: settings?.autoOptimize ?? true,
    autoCopyEnabled: settings?.autoCopy ?? true,
    onTextProcessed: (processedText: string) => {
      setEditText(processedText);
    },
  });

  // 录音相关全局事件
  useVoiceEvents({ recordingState, startRecording, stopRecording });

  const isRecordingDisabled = isOptimizing || isProcessing;

  // 录音状态变化时追加文本
  const prevRecordingState = useRef(recordingState);
  useEffect(() => {
    if (prevRecordingState.current === 'recording' && recordingState !== 'recording') {
      if (finalText) {
        setEditText(prev => prev ? prev + finalText : finalText);
      }
    }
    prevRecordingState.current = recordingState;
  }, [recordingState, finalText]);

  // 调整窗口尺寸
  const updateWindowSize = useCallback(async () => {
    const width = 280;
    const height = isExpanded ? 260 : 40;
    await setWindowSize(width, height);
  }, [isExpanded, setWindowSize]);

  useEffect(() => {
    const timer = setTimeout(updateWindowSize, 50);
    return () => clearTimeout(timer);
  }, [isExpanded, updateWindowSize]);

  // 拖拽处理
  const handleMouseDown = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    if (e.button !== 0) return;
    try {
      await getCurrentWindow().startDragging();
    } catch (err) {
      console.error("Failed to start dragging:", err);
    }
  };

  // 复制
  const handleCopy = async () => {
    if (!editText.trim()) return;
    const success = await copyToClipboard(editText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), UI_CONSTANTS.COPY_FEEDBACK_TIMEOUT);
    }
  };

  // 删除
  const handleDelete = () => {
    setEditText("");
    resetText();
  };

  // 优化
  const handleOptimize = async () => {
    if (!editText.trim() || isOptimizing) return;
    setOptimizeError(null);
    setIsOptimizing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const optimized = await invoke<string>("optimize_text", { text: editText });
      if (optimized && optimized.trim()) {
        resetText();
        setEditText(optimized);
      } else {
        setOptimizeError("优化结果为空");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setOptimizeError(errorMsg);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 粘贴
  const handlePaste = async () => {
    if (!editText.trim()) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke("paste_to_app", { text: editText });
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const isRecording = recordingState === 'recording';

  return (
    <div
      className="bg-(--surface-primary) rounded-xl flex flex-col"
      style={{
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        border: '0.5px solid var(--border-secondary)',
        overflow: 'visible',
      }}
    >
      {/* 工具栏 */}
      <div
        className="flex items-center justify-between px-2 drag-region"
        style={{ height: '36px' }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1">
          <StatusIndicator
            recordingState={recordingState}
            isOptimizing={isOptimizing}
            showText={false}
          />
          <RoleCycler />
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !editText.trim()}
            className="w-6 h-6 flex items-center justify-center rounded transition-all no-drag disabled:opacity-30"
            title="润色"
          >
            {isOptimizing ? (
              <div className="w-3.5 h-3.5 border-2 border-(--system-purple) border-t-transparent rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-3.5 h-3.5" style={{ color: 'var(--system-purple)' }} />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title={isExpanded ? '折叠' : '展开'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            onClick={togglePin}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag ${isPinned ? 'bg-(--role-hover-bg)' : ''}`}
            title={isPinned ? '取消置顶' : '置顶窗口'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isPinned ? 'rotate-45' : ''}`}
              style={{ color: isPinned ? 'var(--system-blue)' : 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <button
            onClick={onSwitchToFull}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-(--role-hover-bg) transition-colors no-drag"
            title="主界面"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          </button>

          <button
            onClick={() => {
              if (recordingState === 'recording') {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            disabled={isRecordingDisabled}
            className={`flex items-center justify-center rounded-full transition-all no-drag ${isRecordingDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: isRecording ? 'var(--system-red)' : 'var(--system-blue)',
              color: 'var(--text-on-primary)',
              boxShadow: isRecording ? '0 0 12px var(--system-red)' : 'var(--shadow-sm)',
            }}
            title={isOptimizing ? '优化中' : isRecording ? '停止' : recordingState === 'processing' ? '处理中' : '录音'}
          >
            {isRecording ? <StopIcon className="w-3 h-3" /> : <MicrophoneIcon className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 输入框区域 */}
      {isExpanded && (
        <div className="px-2 pb-2" style={{ borderTop: '0.5px solid var(--border-secondary)' }}>
          <div className="flex gap-1 mt-2 h-50">
            <div
              className="flex-1 rounded overflow-hidden relative"
              style={{ backgroundColor: 'var(--bg-secondary)', border: 'var(--versus-border-subtle)' }}
            >
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                readOnly={recordingState === 'recording'}
                className="w-full h-full resize-none outline-none p-2"
                style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', overflow: 'auto' }}
                placeholder={recordingState === 'recording' ? '' : '点击按钮开始或直接输入文字'}
              />
              {recordingState === 'recording' && (
                <VoiceOverlay editText={editText} finalText={finalText} interimText={interimText} fontSize={14} lineHeight={1.5} interClassName="p-2" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={handleDelete}
                disabled={!editText.trim() && !finalText && !interimText}
                className="w-6 h-6 flex items-center justify-center rounded transition-colors no-drag disabled:opacity-30 hover:brightness-90"
                title="清空"
              >
                <TrashIcon className="w-3.5 h-3.5" style={{ color: 'var(--system-red)' }} />
              </button>

              <button
                onClick={handleCopy}
                disabled={!editText.trim()}
                className="w-6 h-6 flex items-center justify-center rounded transition-colors no-drag disabled:opacity-30 hover:brightness-90"
                title="复制"
              >
                {copied ? (
                  <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" style={{ color: 'var(--system-green)' }} />
                ) : (
                  <ClipboardDocumentIcon className="w-3.5 h-3.5" style={{ color: 'var(--system-blue)' }} />
                )}
              </button>

              <button
                onClick={handlePaste}
                disabled={!editText.trim()}
                className="w-6 h-6 flex items-center justify-center rounded transition-colors no-drag disabled:opacity-30 hover:brightness-90"
                title="粘贴"
              >
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--system-blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {optimizeError && (
        <div className="px-2 pb-1">
          <div
            className="px-2 py-0.5 rounded text-[10px]"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--system-red)', color: 'var(--system-red)' }}
          >
            {optimizeError}
          </div>
        </div>
      )}
    </div>
  );
}
