// 应用入口
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import VoicePanel from "./components/VoicePanel";
import CompactBar from "./components/CompactBar";
import Settings from "./components/Settings";
import { SettingsProvider } from "./context/SettingsContext";
import { showWindowNearMouse } from "./utils/window";

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const unlisten1 = listen<boolean>("global-shortcut-triggered", async (event) => {
      const autoRecord = event.payload;
      await showWindowNearMouse();
      if (autoRecord) {
        window.dispatchEvent(new CustomEvent("start-recording"));
      }
    });

    const unlisten2 = listen("toggle-shortcut-triggered", () => {
      window.dispatchEvent(new CustomEvent("toggle-recording"));
    });

    return () => {
      unlisten1.then(fn => fn());
      unlisten2.then(fn => fn());
    };
  }, []);

  return (
    <>
      {isCompact ? (
        <CompactBar onSwitchToFull={() => setIsCompact(false)} />
      ) : (
        <VoicePanel
          onSettingsClick={() => setShowSettings(true)}
          onCompact={() => setIsCompact(true)}
        />
      )}

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}

import { useState } from "react";

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
