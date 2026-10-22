// 窗口操作工具
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from "@tauri-apps/api/window";

export const showWindow = async (): Promise<void> => {
  try {
    const win = getCurrentWindow();
    await win.show();
    await win.unminimize();
    await win.setFocus();
    await win.setAlwaysOnTop(true);
  } catch (error) {
    console.error('Failed to show window:', error);
  }
};

export const hideWindow = async (): Promise<void> => {
  try {
    const win = getCurrentWindow();
    await win.setAlwaysOnTop(false);
    await win.minimize();
  } catch (error) {
    console.error('Failed to hide window:', error);
  }
};

export const toggleAlwaysOnTop = async (): Promise<boolean> => {
  try {
    const win = getCurrentWindow();
    const alwaysOnTop = await win.isAlwaysOnTop();
    await win.setAlwaysOnTop(!alwaysOnTop);
    return !alwaysOnTop;
  } catch (error) {
    console.error('Failed to toggle always on top:', error);
    return false;
  }
};

// 在鼠标附近显示窗口
export const showWindowNearMouse = async (offsetX: number = 10, offsetY: number = 10): Promise<void> => {
  try {
    // 获取鼠标位置
    const position = await invoke<[number, number]>('get_mouse_position');
    const [mouseX, mouseY] = position;

    // 设置窗口位置到鼠标附近
    await invoke('set_window_near_mouse', {
      offsetX: mouseX + offsetX,
      offsetY: mouseY + offsetY,
    });

    // 显示窗口
    await showWindow();
  } catch (error) {
    console.error('Failed to show window near mouse:', error);
    // 如果失败，至少显示窗口
    await showWindow();
  }
};