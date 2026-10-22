// API 设置区块
import { ServerStackIcon } from '@heroicons/react/24/outline';
import PasswordInput from '../base/PasswordInput';
import LabelInput from '../base/LabelInput';
import SelectInput from '../base/SelectInput';

interface ApiSettingsSectionProps {
  apiKey: string;
  apiUrl: string;
  model: string;
  onApiKeyChange: (value: string) => void;
  onApiUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

const MODEL_OPTIONS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
];

export function ApiSettingsSection({
  apiKey,
  apiUrl,
  model,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange,
}: ApiSettingsSectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--system-blue-light)' }}
        >
          <ServerStackIcon className="w-4 h-4" style={{ color: 'var(--system-blue)' }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          LLM 配置
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <PasswordInput
          value={apiKey}
          onChange={onApiKeyChange}
          placeholder="sk-..."
          label="API Key"
        />
        <LabelInput
          label="API 地址"
          value={apiUrl}
          onChange={onApiUrlChange}
          placeholder="https://api.openai.com/v1"
        />
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              模型
            </span>
          </div>
          <SelectInput
            value={model}
            onChange={onModelChange}
            options={MODEL_OPTIONS}
            placeholder="输入或选择模型"
            allowCustom={true}
          />
        </div>
      </div>
    </div>
  );
}
