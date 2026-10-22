import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SettingsData, Role } from '../types';

interface SettingsContextType {
  selectedRole: string;
  roles: Role[];
  settings: SettingsData | null;
  setSelectedRole: (roleId: string) => Promise<void>;
  addRole: (role: Role) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SettingsData>) => Promise<void>;
  reloadSettings: () => Promise<void>;
  reloadRoles: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [selectedRole, setSelectedRoleState] = useState('1001');
  const [roles, setRoles] = useState<Role[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  // 保存之前的快捷键，用于清理
  const [previousShortcuts, setPreviousShortcuts] = useState<{
    globalShortcut: string;
    toggleShortcut: string;
  }>({ globalShortcut: '', toggleShortcut: '' });

  // 防抖计时器
  const [registrationTimeout, setRegistrationTimeout] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
    loadRoles();
  }, []);

  // 加载设置后注册全局快捷键
  useEffect(() => {
    // 清除之前的防抖计时器
    if (registrationTimeout) {
      clearTimeout(registrationTimeout);
    }

    let isCancelled = false;

    const registerShortcuts = async () => {
      if (settings && !isCancelled) {
        try {
          // 注册全局快捷键
          const globalShortcut = settings.globalShortcut || '';
          if (globalShortcut) {
            try {
              await invoke("unregister_global_shortcut", { shortcut: globalShortcut });
              // 等待一小段时间确保注销完成
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              // 忽略取消注册错误，但记录日志
              console.log("No global shortcut to unregister or unregister failed:", error);
            }

            // 检查是否已经被取消
            if (!isCancelled) {
              await invoke("register_global_shortcut", {
                shortcut: globalShortcut,
                autoRecord: settings.autoVoiceRecognition ?? false,
              });
              console.log("Initialized global shortcut:", globalShortcut);
            }
          }

          // 注册切换快捷键
          const toggleShortcut = settings.toggleShortcut || '';
          if (toggleShortcut && !isCancelled) {
            try {
              await invoke("unregister_toggle_shortcut", { shortcut: toggleShortcut });
              // 等待一小段时间确保注销完成
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              // 忽略取消注册错误，但记录日志
              console.log("No toggle shortcut to unregister or unregister failed:", error);
            }

            // 再次检查是否已经被取消
            if (!isCancelled) {
              await invoke("register_toggle_shortcut", {
                shortcut: toggleShortcut,
              });
              console.log("Initialized toggle shortcut:", toggleShortcut);
            }
          }
        } catch (error) {
          console.error("Failed to register shortcuts:", error);
        }
      }
    };

    // 使用防抖，300ms 后执行注册
    const timeout = setTimeout(() => {
      registerShortcuts();
    }, 300);

    setRegistrationTimeout(timeout);

    // 清理函数：组件卸载或设置变化时取消操作
    return () => {
      isCancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [settings]);

  const loadSettings = async () => {
    try {
      const data = await invoke<SettingsData>('get_settings');
      setSettings(data);
      setSelectedRoleState(data.selectedRole || '1001');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await invoke<Role[]>('get_roles');
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  // 清理之前的快捷键
  useEffect(() => {
    const cleanupPreviousShortcuts = async () => {
      try {
        // 清理之前的全局快捷键
        if (previousShortcuts.globalShortcut) {
          try {
            await invoke("unregister_global_shortcut", { shortcut: previousShortcuts.globalShortcut });
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.log("Failed to unregister previous global shortcut:", error);
          }
        }

        // 清理之前的切换快捷键
        if (previousShortcuts.toggleShortcut) {
          try {
            await invoke("unregister_toggle_shortcut", { shortcut: previousShortcuts.toggleShortcut });
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.log("Failed to unregister previous toggle shortcut:", error);
          }
        }

        // 保存新的快捷键
        if (settings) {
          setPreviousShortcuts({
            globalShortcut: settings.globalShortcut || '',
            toggleShortcut: settings.toggleShortcut || '',
          });
        }
      } catch (error) {
        console.error("Error cleaning up shortcuts:", error);
      }
    };

    cleanupPreviousShortcuts();
  }, [settings, previousShortcuts.globalShortcut, previousShortcuts.toggleShortcut]);

  // 清理函数：组件卸载时注销所有快捷键
  useEffect(() => {
    return () => {
      const cleanupOnUnmount = async () => {
        if (settings) {
          try {
            if (settings.globalShortcut) {
              await invoke("unregister_global_shortcut", { shortcut: settings.globalShortcut });
            }
            if (settings.toggleShortcut) {
              await invoke("unregister_toggle_shortcut", { shortcut: settings.toggleShortcut });
            }
          } catch (error) {
            console.log("Cleanup on unmount failed:", error);
          }
        }
      };
      cleanupOnUnmount();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<SettingsData>) => {
    try {
      // 获取当前设置
      const currentSettings = settings || {
        apiKey: '',
        apiUrl: '',
        model: '',
        language: '',
        selectedRole: '1001',
        customRoles: [],
        systemPrompt: '你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。',
        autoOptimize: true,
        autoCopy: true,
        globalShortcut: '',
        toggleShortcut: '',
        autoVoiceRecognition: false,
      };

      // 从后端获取最新的 customRoles
      const latestCustomRoles = await invoke<Role[]>('get_roles');

      // 处理 selectedRole - 确保它存在
      let finalSelectedRole = (newSettings.selectedRole || currentSettings.selectedRole || '1001');

      // 验证选中的角色是否存在
      if (finalSelectedRole) {
        const roleExists = latestCustomRoles.some(role => role.id === finalSelectedRole)
          || ['1001', '1002', '1003', '1004'].includes(finalSelectedRole);

        if (!roleExists) {
          console.warn(`Selected role ${finalSelectedRole} does not exist, defaulting to '1001'`);
          finalSelectedRole = '1001';
        }
      }

      // 过滤掉 customRoles，只允许通过角色管理 API 修改
      const { customRoles, ...filteredNewSettings } = newSettings;

      const updatedSettings: SettingsData = {
        apiKey: currentSettings.apiKey || '',
        apiUrl: currentSettings.apiUrl || '',
        model: currentSettings.model || '',
        language: currentSettings.language || '',
        selectedRole: finalSelectedRole,
        customRoles: latestCustomRoles, // 始终使用最新的角色数据
        systemPrompt: currentSettings.systemPrompt || '你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。',
        autoOptimize: currentSettings.autoOptimize ?? true,
        autoCopy: currentSettings.autoCopy ?? true,
        globalShortcut: currentSettings.globalShortcut || '',
        toggleShortcut: currentSettings.toggleShortcut || '',
        autoVoiceRecognition: currentSettings.autoVoiceRecognition ?? false,
        ...filteredNewSettings,
      };

      await invoke('save_settings', { settings: updatedSettings });
      setSettings(updatedSettings);

      // 如果 selectedRole 被重置了，更新前端状态
      if (finalSelectedRole !== currentSettings.selectedRole && newSettings.selectedRole !== finalSelectedRole) {
        setSelectedRoleState(finalSelectedRole);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const setSelectedRole = async (roleId: string) => {
    setSelectedRoleState(roleId);
    try {
      await invoke('set_selected_role', { roleId: roleId });
      // 同时更新 settings 中的 selectedRole
      if (settings) {
        setSettings({ ...settings, selectedRole: roleId });
      }
    } catch (error) {
      console.error('Failed to save selected role:', error);
    }
  };

  const addRole = async (role: Role) => {
    try {
      await invoke('add_role', { role });
      await loadRoles();
    } catch (error) {
      console.error('Failed to add role:', error);
      throw error;
    }
  };

  const updateRole = async (role: Role) => {
    try {
      await invoke('update_role', { role });
      await loadRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      await invoke('delete_role', { roleId: roleId });
      await loadRoles();
      if (selectedRole === roleId) {
        // 删除当前选中的角色后，切换到默认角色并保存到后端
        await invoke('set_selected_role', { roleId: '1001' });
        setSelectedRoleState('1001');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw error;
    }
  };

  const reloadSettings = async () => {
    await loadSettings();
  };

  const reloadRoles = async () => {
    await loadRoles();
  };

  return (
    <SettingsContext.Provider
      value={{
        selectedRole,
        roles,
        settings,
        setSelectedRole,
        addRole,
        updateRole,
        deleteRole,
        updateSettings,
        reloadSettings,
        reloadRoles,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}
