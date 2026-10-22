// API 服务层 - 统一管理所有 Tauri invoke 调用
import { invoke } from '@tauri-apps/api/core';
import { SettingsData, Role } from '../types';

// 设置相关
export const settingsApi = {
  get: () => invoke<SettingsData>('get_settings'),
  save: (settings: SettingsData) => invoke('save_settings', { settings }),
};

// 角色相关
export const roleApi = {
  getAll: () => invoke<Role[]>('get_roles'),
  add: (role: Role) => invoke('add_role', { role }),
  update: (role: Role) => invoke('update_role', { role }),
  delete: (roleId: string) => invoke('delete_role', { roleId }),
  setSelected: (roleId: string) => invoke('set_selected_role', { roleId }),
};

// 文本处理相关
export const textApi = {
  optimize: (text: string) => invoke<string>('optimize_text', { text }),
  paste: (text: string) => invoke('paste_to_app', { text }),
};

// 快捷键相关
export const shortcutApi = {
  register: (shortcut: string, autoRecord: boolean) =>
    invoke('register_global_shortcut', { shortcut, autoRecord }),
  unregister: (shortcut: string) =>
    invoke('unregister_global_shortcut', { shortcut }),
  registerToggle: (shortcut: string) =>
    invoke('register_toggle_shortcut', { shortcut }),
  unregisterToggle: (shortcut: string) =>
    invoke('unregister_toggle_shortcut', { shortcut }),
};

// 窗口相关
export const windowApi = {
  hide: () => invoke('hide_window'),
  minimize: () => invoke('minimize_window'),
  setSize: (width: number, height: number) =>
    invoke('set_window_size', { width, height }),
  getMousePosition: () => invoke<[number, number]>('get_mouse_position'),
  setNearMouse: (offsetX: number, offsetY: number) =>
    invoke('set_window_near_mouse', { offsetX, offsetY }),
};
