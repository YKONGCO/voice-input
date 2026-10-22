// 语音输入面板
import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSettingsContext } from "../context/SettingsContext";
import { copyToClipboard } from "../utils/clipboard";
import { UI_CONSTANTS } from "../constants/ui";
import { VoiceOverlay } from "./base/VoiceOverlay";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useWindowControls } from "../hooks/useWindowControls";
import { useVoiceEvents } from "../hooks/useVoiceEvents";
import { HeaderBar, ActionButtons } from "./voice-panel";

interface VoicePanelProps {
  onSettingsClick: () => void;
  onCompact: () => void;
}

export default function VoicePanel({ onSettingsClick, onCompact }: VoicePanelProps) {
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [editText, setEditText] = useState("");
  const { settings } = useSettingsContext();
  const { setWindowSize, togglePin, isPinned } = useWindowControls();

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

  // 设置窗口尺寸
  useEffect(() => {
    setWindowSize(280, 350);
  }, [setWindowSize]);

  const isRecordingDisabled = isOptimizing || isProcessing;

  // 拖拽处理
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    if (!(e.target as HTMLElement).closest(".drag-region")) return;
    if (e.button !== 0) return;
    try {
      await getCurrentWindow().startDragging();
    } catch (err) {
      console.error("Failed to start dragging:", err);
    }
  }, []);

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

  // 复制到剪贴板
  const handleCopy = async () => {
    if (editText.trim()) {
      const success = await copyToClipboard(editText);
      if (success) {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setStatusMessage(null);
        }, UI_CONSTANTS.COPY_FEEDBACK_TIMEOUT);
      }
    }
  };

  // 优化文本
  const handleOptimize = async () => {
    if (!editText.trim() || isOptimizing) return;
    setStatusMessage(null);
    setIsOptimizing(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const optimized = await invoke<string>("optimize_text", { text: editText });
      if (optimized && optimized.trim()) {
        resetText();
        setEditText(optimized);
      } else {
        setStatusMessage({ text: '优化结果为空', type: 'error' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ text: errorMsg, type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 粘贴到目标应用
  const handlePaste = async () => {
    if (!editText.trim()) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke("paste_to_app", { text: editText });
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  // 删除文本
  const handleDelete = () => {
    setEditText("");
    resetText();
  };

  return (
    <div
      className="w-full h-full bg-(--bg-secondary) rounded-xl overflow-hidden flex flex-col shadow-lg"
      style={{
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
      }}
    >
      <HeaderBar
        recordingState={recordingState}
        isOptimizing={isOptimizing}
        statusMessage={statusMessage}
        isPinned={isPinned}
        onCompact={onCompact}
        onSettingsClick={onSettingsClick}
        onMouseDown={handleMouseDown}
        togglePin={togglePin}
      />

      <div className="flex-1 flex flex-col" style={{ padding: '2%', gap: '2%' }}>
        {/* 文本编辑区域 */}
        <div
          className="flex-1 bg-(--surface-primary) rounded-xl overflow-hidden relative"
          style={{ border: 'var(--versus-border-subtle)' }}
        >
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            readOnly={recordingState === 'recording'}
            className="w-full h-full resize-none outline-none p-3"
            style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
            }}
            placeholder={recordingState === 'recording' ? '' : '点击按钮开始或直接输入文字'}
          />

          {recordingState === 'recording' && (
            <VoiceOverlay
              editText={editText}
              finalText={finalText}
              interimText={interimText}
              interClassName="p-3"
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <ActionButtons
          editText={editText}
          finalText={finalText}
          interimText={interimText}
          recordingState={recordingState}
          isOptimizing={isOptimizing}
          isRecordingDisabled={isRecordingDisabled}
          copied={copied}
          onOptimize={handleOptimize}
          onDelete={handleDelete}
          onToggleRecording={() => {
            if (recordingState === 'recording') {
              stopRecording();
            } else {
              startRecording();
            }
          }}
          onCopy={handleCopy}
          onPaste={handlePaste}
        />
      </div>
    </div>
  );
}
