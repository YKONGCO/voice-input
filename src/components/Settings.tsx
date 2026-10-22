// 设置弹窗
import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useSettingsContext } from '../context/SettingsContext';
import { Role } from '../types';
import { shortcutService } from '../services';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiSettingsSection,
  LanguageSection,
  TextProcessingSection,
  ShortcutSettingsSection,
  RoleManagerSection,
} from './settings-components';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const { settings, updateSettings, setSelectedRole, roles, addRole, updateRole, deleteRole, selectedRole } = useSettingsContext();

  // 本地状态
  const [localApiUrl, setLocalApiUrl] = useState("");
  const [localApiKey, setLocalApiKey] = useState("");
  const [localAutoVoiceRecognition, setLocalAutoVoiceRecognition] = useState(false);
  const [localGlobalShortcut, setLocalGlobalShortcut] = useState("");
  const [localToggleShortcut, setLocalToggleShortcut] = useState("");

  // 初始化本地状态
  useEffect(() => {
    if (settings) {
      setLocalApiUrl(settings.apiUrl || "");
      setLocalApiKey(settings.apiKey || "");
      setLocalAutoVoiceRecognition(settings.autoVoiceRecognition ?? false);
      setLocalGlobalShortcut(settings.globalShortcut || "");
      setLocalToggleShortcut(settings.toggleShortcut || "");
    }
  }, [settings]);

  const currentModel = settings?.model || "gpt-3.5-turbo";

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings({
        apiKey: localApiKey,
        apiUrl: localApiUrl,
        model: currentModel,
        language: settings?.language || "zh-CN",
        selectedRole: selectedRole,
        autoOptimize: settings?.autoOptimize ?? true,
        autoCopy: settings?.autoCopy ?? true,
        globalShortcut: localGlobalShortcut,
        toggleShortcut: localToggleShortcut,
        autoVoiceRecognition: localAutoVoiceRecognition,
      });

      // 注册全局快捷键
      await shortcutService.registerGlobalShortcut(
        localGlobalShortcut,
        localAutoVoiceRecognition
      );

      // 注册切换快捷键
      await shortcutService.registerToggleShortcut(localToggleShortcut);

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 300);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  // 角色管理操作
  const handleAddRole = () => {
    setEditingRole({
      id: uuidv4(),
      name: "",
      desc: "",
      prompt: "",
    });
    setIsAddingRole(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
    setIsAddingRole(false);
  };

  const handleSaveRole = async (role: Role) => {
    if (!role) return;
    setRoleError(null);
    try {
      if (isAddingRole) {
        await addRole(role);
      } else {
        await updateRole(role);
      }
      setEditingRole(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to save role:", errorMessage);
      setRoleError(errorMessage);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center rounded-xl z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-(--bg-secondary) rounded-xl w-105 max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderBottom: '0.5px solid var(--border-secondary)' }}
        >
          <h2
            className="text-[16px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            设置
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-(--role-hover-bg) transition-colors"
            title="关闭设置"
          >
            <XMarkIcon
              className="w-4 h-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto scrollbar-none" style={{ padding: '16px' }}>
          <ApiSettingsSection
            apiKey={localApiKey}
            apiUrl={localApiUrl}
            model={currentModel}
            onApiKeyChange={setLocalApiKey}
            onApiUrlChange={setLocalApiUrl}
            onModelChange={(value) => updateSettings({ model: value })}
          />

          <div className="mb-4" style={{ height: '0.5px', backgroundColor: 'var(--border-secondary)' }} />

          <LanguageSection
            language={settings?.language || "zh-CN"}
            onLanguageChange={(value) => updateSettings({ language: value })}
          />

          <div className="mb-4" style={{ height: '0.5px', backgroundColor: 'var(--border-secondary)' }} />

          <TextProcessingSection
            autoOptimize={settings?.autoOptimize ?? true}
            autoCopy={settings?.autoCopy ?? true}
            onAutoOptimizeChange={(checked) => updateSettings({ autoOptimize: checked })}
            onAutoCopyChange={(checked) => updateSettings({ autoCopy: checked })}
          />

          <div className="mb-4" style={{ height: '0.5px', backgroundColor: 'var(--border-secondary)' }} />

          <ShortcutSettingsSection
            globalShortcut={localGlobalShortcut}
            toggleShortcut={localToggleShortcut}
            autoVoiceRecognition={localAutoVoiceRecognition}
            onGlobalShortcutChange={setLocalGlobalShortcut}
            onToggleShortcutChange={setLocalToggleShortcut}
            onAutoVoiceRecognitionChange={(checked) => {
              setLocalAutoVoiceRecognition(checked);
              updateSettings({ autoVoiceRecognition: checked });
            }}
          />

          <div className="mb-4" style={{ height: '0.5px', backgroundColor: 'var(--border-secondary)' }} />

          <RoleManagerSection
            roles={roles}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            onAddRole={handleAddRole}
            onEditRole={handleEditRole}
            onDeleteRole={handleDeleteRole}
            onSaveRole={handleSaveRole}
            editingRole={editingRole}
            isAddingRole={isAddingRole}
            onCancelEdit={() => {
              setEditingRole(null);
              setRoleError(null);
            }}
            error={roleError}
          />
        </div>

        {/* 底部操作栏 */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-2"
          style={{ borderTop: '0.5px solid var(--border-secondary)' }}
        >
          <button
            onClick={onClose}
            className="px-2 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            取消
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-2 py-1.5 text-[13px] font-medium rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--system-blue)',
              color: 'var(--text-on-primary)',
            }}
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中
              </>
            ) : saved ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                已保存
              </>
            ) : (
              "保存"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
