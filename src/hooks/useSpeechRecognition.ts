import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RecordingState } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { showWindow } from '../utils/window';
import { UI_CONSTANTS } from '../constants/ui';

interface UseSpeechRecognitionProps {
  autoOptimizeEnabled?: boolean;
  autoCopyEnabled?: boolean;
  onTextProcessed?: (text: string) => void;
}

export const useSpeechRecognition = ({ autoOptimizeEnabled: externalAutoOptimize, autoCopyEnabled: externalAutoCopy, onTextProcessed }: UseSpeechRecognitionProps = {}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const isStoppingRef = useRef(false);
  const silenceTimeoutRef = useRef<number | undefined>(undefined);
  const onTextProcessedRef = useRef(onTextProcessed);

  // 更新回调引用
  useEffect(() => {
    onTextProcessedRef.current = onTextProcessed;
  }, [onTextProcessed]);

  // 使用外部传入的设置，如果没有传入则默认为 true
  const autoOptimizeEnabled = externalAutoOptimize ?? true;
  const autoCopyEnabled = externalAutoCopy ?? true;

  // 初始化语音识别
  const initializeRecognition = useCallback(() => {
    if (recognitionRef.current || typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition ||
                            (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimText(interim);
      if (final) {
        setFinalText(prev => prev + final);
        // 只有在录音状态下才重置静默超时
        if (recordingState === 'recording') {
          resetSilenceTimeout();
        }
      }
    };

    recognition.onerror = (error: any) => {
      console.error('Speech recognition error:', error);
      // 发生错误时强制停止
      isRunningRef.current = false;
      isStoppingRef.current = false;
      setRecordingState('idle');
    };

    recognition.onend = () => {
      // 如果正在停止过程中，等待最后的 onresult 处理
      if (isStoppingRef.current) {
        // 延迟一点时间确保 onresult 已经处理完最后的音频
        setTimeout(() => {
          isStoppingRef.current = false;
          setRecordingState('idle');
          setInterimText('');
        }, 50);
        return;
      }

      // 只有在 isRunningRef 为 true 时才说明是非正常结束
      if (isRunningRef.current) {
        // 标记为已停止
        isRunningRef.current = false;
        isStoppingRef.current = false;
        setRecordingState('idle');
      }
    };

    recognitionRef.current = recognition;
  }, [recordingState]);

  // 重置静默超时
  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = window.setTimeout(() => {
      if (recordingState === 'recording') {
        stopRecording();
      }
    }, UI_CONSTANTS.SILENCE_TIMEOUT);
  }, [recordingState]);

  // 开始录音
  const startRecording = useCallback(async () => {
    // 如果已经在录音或正在处理或正在停止中，不开始
    if (recordingState === 'recording' || isProcessing || isStoppingRef.current) {
      return;
    }

    if (!recognitionRef.current) {
      initializeRecognition();
    }

    if (!recognitionRef.current) {
      console.error('Recognition not initialized');
      return;
    }

    try {
      // 先设置状态为录音中
      isRunningRef.current = true;
      setRecordingState('recording');
      setFinalText('');
      setInterimText('');

      await showWindow();

      // 尝试启动识别器
      recognitionRef.current.start();
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      isRunningRef.current = false;

      // 如果是已经启动的错误，说明已经在运行
      if (error?.name === 'InvalidStateError') {
        // 检查识别器是否真的在运行
        try {
          recognitionRef.current.stop();
          isRunningRef.current = true;
          setRecordingState('recording');
        } catch {
          setRecordingState('idle');
        }
        return;
      }
      setRecordingState('idle');
    }
  }, [initializeRecognition, recordingState, isProcessing]);

  // 停止录音
  const stopRecording = useCallback(async () => {
    // 标记为正在停止
    isStoppingRef.current = true;

    // 标记为不再运行
    isRunningRef.current = false;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // 尝试停止识别器
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // 忽略停止时的错误
        // 即使出错，也标记为已停止
        isStoppingRef.current = false;
        setRecordingState('idle');
        setInterimText('');
      }
    }

    // 不再自动隐藏窗口，由用户手动控制
    // 真正的状态更新在 onend 回调中处理
  }, []);

  // 重置文本
  const resetText = useCallback(() => {
    setFinalText('');
    setInterimText('');
  }, []);

  // 处理文本（用于自动优化）
  const processText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // 先停止录音
    isRunningRef.current = false;
    isStoppingRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsProcessing(true);
    setRecordingState('processing');

    try {
      const processedText = await invoke<string>('optimize_text', {
        text
      });

      if (processedText && processedText.trim()) {
        // 自动复制到剪贴板
        await copyToClipboard(processedText);

        // 清空识别文本
        resetText();

        // 调用回调通知处理完成（用于自动优化时更新输入框）
        if (onTextProcessedRef.current) {
          onTextProcessedRef.current(processedText);
        }

        setRecordingState('speaking');
        window.setTimeout(() => {
          setRecordingState('idle');
        }, UI_CONSTANTS.SPEAKING_DURATION);
      } else {
        setRecordingState('idle');
      }
    } catch (error) {
      console.error('Failed to process text:', error);
      await copyToClipboard(text);
      setRecordingState('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [resetText]);

  // 直接复制文本到剪贴板（不优化）
  const directCopy = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // 先停止录音
    isRunningRef.current = false;
    isStoppingRef.current = false;
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setRecordingState('idle');

    try {
      // 直接复制到剪贴板
      await copyToClipboard(text);
      // 清空识别文本
      resetText();
      setRecordingState('speaking');
      window.setTimeout(() => {
        setRecordingState('idle');
      }, UI_CONSTANTS.SPEAKING_DURATION);
    } catch (error) {
      console.error('Failed to copy text:', error);
      setRecordingState('idle');
    }
  }, [resetText]);

  // 监听录音状态变化，录音结束后自动处理文本
  const prevRecordingState = useRef<RecordingState>('idle');
  useEffect(() => {
    // 从录音中变为非录音状态时
    if (prevRecordingState.current === 'recording' && recordingState !== 'recording') {
      const fullText = finalText.trim();
      // 如果有文本且开启了自动优化或自动复制
      if (fullText && (autoOptimizeEnabled || autoCopyEnabled)) {
        // 延迟一点确保 finalText 已更新
        setTimeout(() => {
          confirmText();
        }, 100);
      }
    }
    prevRecordingState.current = recordingState;
  }, [recordingState, finalText, autoOptimizeEnabled, autoCopyEnabled]);

  // 确认并处理文本
  const confirmText = useCallback(() => {
    const fullText = finalText.trim();
    if (!fullText) return;

    // 使用本地状态
    if (autoOptimizeEnabled) {
      // 需要优化
      processText(fullText);
    } else if (autoCopyEnabled) {
      // 不需要优化但需要自动复制
      directCopy(fullText);
    } else {
      // 只复制到剪贴板
      copyToClipboard(fullText).then(() => {
        // 提示用户已复制
      });
    }
  }, [finalText, processText, directCopy, autoOptimizeEnabled, autoCopyEnabled]);

  return {
    recordingState,
    interimText,
    finalText,
    isProcessing,
    startRecording,
    stopRecording,
    confirmText,
    resetText,
  };
};
