// 快捷键服务 - 统一管理快捷键注册
import { shortcutApi } from './api';

export const shortcutService = {
  async registerGlobalShortcut(shortcut: string, autoRecord: boolean): Promise<void> {
    if (!shortcut) return;
    try {
      await shortcutApi.unregister(shortcut);
    } catch {
      // 忽略注销错误
    }
    await shortcutApi.register(shortcut, autoRecord);
  },

  async registerToggleShortcut(shortcut: string): Promise<void> {
    if (!shortcut) return;
    try {
      await shortcutApi.unregisterToggle(shortcut);
    } catch {
      // 忽略注销错误
    }
    await shortcutApi.registerToggle(shortcut);
  },

  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    if (!shortcut) return;
    try {
      await shortcutApi.unregister(shortcut);
    } catch {
      // 忽略错误
    }
  },

  async unregisterToggleShortcut(shortcut: string): Promise<void> {
    if (!shortcut) return;
    try {
      await shortcutApi.unregisterToggle(shortcut);
    } catch {
      // 忽略错误
    }
  },
};
