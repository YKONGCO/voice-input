interface VoiceOverlayProps {
  editText: string;
  finalText: string;
  interimText: string;
  className?: string;
  interClassName?: string;
  fontSize?: number;
  lineHeight?: number;
}

export function VoiceOverlay({ editText, finalText, interimText, className, interClassName, fontSize = 15, lineHeight = 1.6 }: VoiceOverlayProps) {
  return (
    <div
      className={`absolute top-0 left-0 w-full h-full pointer-events-none ${className || ''}`}
      style={{
        backgroundColor: 'rgba(0,0,0,0)',
      }}
    >
      <div className="h-full overflow-hidden">
        <div
          className={`whitespace-pre-wrap ${interClassName || ''}`}
          style={{
            fontSize: fontSize,
            lineHeight: lineHeight,
          }}
        >
          {/* 已有文字透明，已确认的 finalText 黑色，正在识别的 interimText 灰色 */}
          <span style={{ color: 'transparent' }}>{editText}</span>
          <span style={{ color: 'var(--text-primary)' }}>{finalText}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>{interimText}</span>
        </div>
      </div>
    </div>
  );
}
