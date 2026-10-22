interface StatusIndicatorProps {
  recordingState: 'idle' | 'recording' | 'processing' | 'speaking';
  isOptimizing: boolean;
  showText?: boolean;
}

export function StatusIndicator({ recordingState, isOptimizing, showText = true }: StatusIndicatorProps) {
  const getStatusColor = () => {
    if (isOptimizing) return 'var(--system-purple)';
    switch (recordingState) {
      case 'recording': return 'var(--system-red)';
      case 'processing': return 'var(--system-orange)';
      default: return 'var(--gray-3)';
    }
  };

  const getStatusText = () => {
    if (isOptimizing) return '优化中';
    switch (recordingState) {
      case 'recording': return '识别中';
      case 'processing': return '处理中';
      default: return '';
    }
  };

  const showStatus = isOptimizing || recordingState !== 'idle';
  const color = getStatusColor();

  return (
    <>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: color,
          animation: showStatus ? 'pulse 1.5s infinite' : 'none'
        }}
      />
      {showText && showStatus && (
        <span
          className="text-[10px] font-medium"
          style={{ color }}
        >
          {getStatusText()}
        </span>
      )}
    </>
  );
}
