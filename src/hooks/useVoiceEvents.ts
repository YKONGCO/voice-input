// 语音相关全局事件 hook
import { useEffect, useCallback } from 'react';
import { RecordingState } from '../types';

interface UseVoiceEventsOptions {
  recordingState: RecordingState;
  startRecording: () => void;
  stopRecording: () => void;
}

export function useVoiceEvents({ recordingState, startRecording, stopRecording }: UseVoiceEventsOptions) {
  // 切换录音
  const toggleRecording = useCallback(() => {
    if (recordingState === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  // 监听全局快捷键触发的录音开始事件
  useEffect(() => {
    const handleStartRecording = () => {
      if (recordingState !== 'recording') {
        startRecording();
      }
    };

    window.addEventListener('start-recording', handleStartRecording);
    return () => window.removeEventListener('start-recording', handleStartRecording);
  }, [startRecording, recordingState]);

  // 监听切换快捷键事件
  useEffect(() => {
    window.addEventListener('toggle-recording', toggleRecording);
    return () => window.removeEventListener('toggle-recording', toggleRecording);
  }, [toggleRecording]);

  return { toggleRecording };
}
