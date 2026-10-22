use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

pub struct SpeechRecognizer {
    is_recording: Arc<Mutex<bool>>,
    recognized_text: Arc<Mutex<String>>,
}

impl SpeechRecognizer {
    pub fn new() -> Self {
        Self {
            is_recording: Arc::new(Mutex::new(false)),
            recognized_text: Arc::new(Mutex::new(String::new())),
        }
    }
}

// 语音识别现在由前端 Web Speech API 处理
// 后端只需提供状态管理接口

#[tauri::command]
pub async fn start_speech_recognition(
    _app: AppHandle,
    state: State<'_, SpeechRecognizer>,
) -> Result<(), String> {
    // 检查是否已在录音
    {
        let is_recording = state.is_recording.lock().map_err(|e| e.to_string())?;
        if *is_recording {
            return Err("Already recording".to_string());
        }
    }

    // 设置为录音中
    {
        let mut is_recording = state.is_recording.lock().map_err(|e| e.to_string())?;
        *is_recording = true;
    }

    log::info!("[Speech] Recording started");
    Ok(())
}

#[tauri::command]
pub async fn stop_speech_recognition(
    app: AppHandle,
    state: State<'_, SpeechRecognizer>,
) -> Result<String, String> {
    log::info!("Stopping speech recognition");

    // 停止录音状态
    {
        let mut is_recording = state.is_recording.lock().map_err(|e| e.to_string())?;
        *is_recording = false;
    }

    // 获取识别结果（由前端 Web Speech API 直接设置）
    let text = {
        let text = state.recognized_text.lock().map_err(|e| e.to_string())?;
        text.clone()
    };

    // 通知前端停止
    app.emit("recording-stopped", &text).map_err(|e| e.to_string())?;

    Ok(text)
}

// 监听语音事件（预留接口）
#[tauri::command]
pub async fn listen_speech() -> Result<(), String> {
    log::info!("Listening for speech events");
    Ok(())
}
