import { useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowControls() {
  const [isPinned, setIsPinned] = useState(false);

  const closeWindow = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await invoke("hide_window");
    } catch {
      await getCurrentWindow().hide();
    }
  }, []);

  const minimizeWindow = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await invoke("minimize_window");
    } catch {
      await getCurrentWindow().minimize();
    }
  }, []);

  const setWindowSize = useCallback(async (width: number, height: number) => {
    try {
      await invoke("set_window_size", { width, height });
    } catch (error) {
      console.error("Failed to set window size:", error);
    }
  }, []);

  const togglePin = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const newPinned = !isPinned;
      await getCurrentWindow().setAlwaysOnTop(newPinned);
      setIsPinned(newPinned);
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }, [isPinned]);

  return {
    closeWindow,
    minimizeWindow,
    setWindowSize,
    togglePin,
    isPinned,
  };
}
