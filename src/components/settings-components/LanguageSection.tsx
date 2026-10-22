// 语言设置区块
import { LanguageIcon } from '@heroicons/react/24/outline';
import SelectInput from '../base/SelectInput';

interface LanguageSectionProps {
  language: string;
  onLanguageChange: (value: string) => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '中文' },
  { value: 'zh-TW', label: '繁体' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
];

export function LanguageSection({ language, onLanguageChange }: LanguageSectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--system-green-light)' }}
        >
          <LanguageIcon className="w-4 h-4" style={{ color: 'var(--system-green)' }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          语言设置
        </span>
      </div>
      <SelectInput
        value={language}
        onChange={onLanguageChange}
        options={LANGUAGE_OPTIONS}
        placeholder="选择语言"
        allowCustom={false}
      />
    </div>
  );
}
