mod speech;
mod llm;
mod settings;

use speech::SpeechRecognizer;
use settings::Settings;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri::Emitter;
use tauri::image::Image;
use std::fs::OpenOptions;
use std::io::Write;
use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

fn write_log(msg: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("voice-input.log")
    {
        let _ = writeln!(file, "[{}] {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"), msg);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 设置panic hook
    panic::set_hook(Box::new(|info| {
        write_log(&format!("PANIC: {}", info));
    }));

    write_log("Starting VoiceInput application");

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {

            #[cfg(debug_assertions)] // 仅在调试构建时包含此代码
            {
            let window = app.get_webview_window("main").unwrap();
            window.open_devtools();
            window.close_devtools();
            }

            write_log("Setting up application");

            app.manage(SpeechRecognizer::new());
            app.manage(Settings::new());

            // 创建系统托盘菜单
            let show_item = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // 创建系统托盘
            let icon = app.default_window_icon().cloned().unwrap_or_else(|| {
                Image::new_owned(vec![0u8; 32 * 32 * 4], 32, 32)
            });

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .tooltip("语音输入")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } => {
                            // 点击托盘图标显示窗口
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            speech::start_speech_recognition,
            speech::stop_speech_recognition,
            speech::listen_speech,
            llm::optimize_text,
            settings::get_settings,
            settings::save_settings,
            settings::get_roles,
            settings::add_role,
            settings::update_role,
            settings::delete_role,
            settings::set_selected_role,
            copy_to_clipboard,
            paste_to_app,
            hide_window,
            minimize_window,
            toggle_always_on_top,
            get_mouse_position,
            set_window_near_mouse,
            register_global_shortcut,
            unregister_global_shortcut,
            register_toggle_shortcut,
            unregister_toggle_shortcut,
            start_mouse_listener,
            stop_mouse_listener,
            set_window_size,
            set_window_resizable,
        ])
        .run(tauri::generate_context!());

    if let Err(e) = result {
        write_log(&format!("Error: {}", e));
        eprintln!("Error: {}", e);
    }
}

// 复制到剪贴板
#[tauri::command]
async fn copy_to_clipboard(text: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard().write_text(text).map_err(|e| e.to_string())?;
    Ok(())
}

// 粘贴到目标应用
#[tauri::command]
async fn paste_to_app(text: String, app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    use std::thread;
    use std::time::Duration;

    // 先复制到剪贴板
    app.clipboard().write_text(text).map_err(|e| e.to_string())?;

    // 延迟后模拟Ctrl+V（使用纯 Rust Windows API）
    thread::spawn(move || {
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS,
            KEYEVENTF_KEYUP, VK_CONTROL
        };
        // V 键的虚拟键码是 0x56
        const VK_V: windows::Win32::UI::Input::KeyboardAndMouse::VIRTUAL_KEY = windows::Win32::UI::Input::KeyboardAndMouse::VIRTUAL_KEY(0x56);

        // 等待一小段时间让剪贴板准备好
        thread::sleep(Duration::from_millis(100));

        // 按下 Ctrl
        let inputs = [
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_CONTROL,
                        wScan: 0,
                        dwFlags: KEYBD_EVENT_FLAGS(0),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // 按下 V
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_V,
                        wScan: 0,
                        dwFlags: KEYBD_EVENT_FLAGS(0),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // 松开 V
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_V,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
            // 松开 Ctrl
            INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: VK_CONTROL,
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            },
        ];

        unsafe {
            let _ = SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
        }
    });

    Ok(())
}

// 隐藏窗口
#[tauri::command]
async fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    write_log("Hiding window");
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 最小化窗口
#[tauri::command]
async fn minimize_window(app: tauri::AppHandle) -> Result<(), String> {
    write_log("Minimizing window");
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 切换窗口置顶状态
#[tauri::command]
async fn toggle_always_on_top(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_on_top = window.is_always_on_top().map_err(|e| e.to_string())?;
        let new_state = !is_on_top;
        window.set_always_on_top(new_state).map_err(|e| e.to_string())?;
        write_log(&format!("Toggled always on top: {}", new_state));
        return Ok(new_state);
    }
    Err("Window not found".to_string())
}

// 获取鼠标位置
#[tauri::command]
fn get_mouse_position() -> Result<(i32, i32), String> {
    #[cfg(windows)]
    {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;

        let mut point = POINT::default();
        unsafe {
            if GetCursorPos(&mut point).is_ok() {
                return Ok((point.x, point.y));
            }
        }
        Err("Failed to get mouse position".to_string())
    }
    #[cfg(not(windows))]
    {
        Err("Not supported on this platform".to_string())
    }
}

// 全局鼠标监听器状态
static MOUSE_LISTENER_RUNNING: AtomicBool = AtomicBool::new(false);

// 启动全局鼠标监听器，持续发送鼠标位置到前端
#[tauri::command]
fn start_mouse_listener(app: tauri::AppHandle) -> Result<(), String> {
    if MOUSE_LISTENER_RUNNING.load(Ordering::SeqCst) {
        return Ok(()); // 已经在运行
    }

    MOUSE_LISTENER_RUNNING.store(true, Ordering::SeqCst);
    let app_handle = app.clone();

    thread::spawn(move || {
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
        use windows::Win32::Foundation::POINT;

        while MOUSE_LISTENER_RUNNING.load(Ordering::SeqCst) {
            let mut point = POINT::default();
            unsafe {
                if GetCursorPos(&mut point).is_ok() {
                    let _ = app_handle.emit("device-mouse-move", (point.x, point.y));
                }
            }
            // 每 16ms 发送一次（约 60fps）
            thread::sleep(Duration::from_millis(16));
        }
    });

    Ok(())
}

// 停止全局鼠标监听器
#[tauri::command]
fn stop_mouse_listener() -> Result<(), String> {
    MOUSE_LISTENER_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

// 设置窗口到指定位置附近
#[tauri::command]
async fn set_window_near_mouse(app: tauri::AppHandle, offset_x: i32, offset_y: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // 获取窗口尺寸
        let _size = window.outer_size().map_err(|e| e.to_string())?;

        // 设置位置
        window.set_position(tauri::Position::Physical(
            tauri::PhysicalPosition::new(offset_x, offset_y)
        )).map_err(|e| e.to_string())?;

        // 确保窗口在屏幕内
        // 这里可以添加边界检查逻辑

        write_log(&format!("Window moved to ({}, {})", offset_x, offset_y));
    }
    Ok(())
}

// 注册全局快捷键
#[tauri::command]
async fn register_global_shortcut(
    app: tauri::AppHandle,
    shortcut: String,
    auto_record: bool,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    write_log(&format!("Registering global shortcut: {}, auto_record: {}", shortcut, auto_record));

    // 转换快捷键格式：将 "Ctrl" 转换为 "CommandOrControl"
    let normalized_shortcut = shortcut
        .replace("Ctrl", "CommandOrControl")
        .replace("ctrl", "CommandOrControl");

    write_log(&format!("Normalized shortcut: {}", normalized_shortcut));

    // 解析快捷键
    let shortcutparsed: Result<tauri_plugin_global_shortcut::Shortcut, _> = normalized_shortcut.parse();

    if let Ok(shortcutparsed) = shortcutparsed {
        // 先尝试注销现有的快捷键（如果存在）
        if let Err(e) = app.global_shortcut().unregister(shortcutparsed.clone()) {
            write_log(&format!("No existing global shortcut to unregister: {}", e));
        }

        let app_handle = app.clone();
        app.global_shortcut().on_shortcut(shortcutparsed, move |_app, _shortcut, _event| {
            write_log("Global shortcut triggered");

            // 显示窗口在鼠标附近
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
                let _ = window.set_always_on_top(true);

                // 触发前端事件，通知快捷键被按下
                let _ = window.emit("global-shortcut-triggered", auto_record);
            }
        }).map_err(|e| e.to_string())?;
    } else {
        return Err(format!("Invalid shortcut format: {}", shortcut));
    }

    Ok(())
}

// 注销全局快捷键
#[tauri::command]
async fn unregister_global_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    write_log(&format!("Unregistering global shortcut: {}", shortcut));

    // 转换快捷键格式
    let normalized_shortcut = shortcut
        .replace("Ctrl", "CommandOrControl")
        .replace("ctrl", "CommandOrControl");

    let shortcutparsed: Result<tauri_plugin_global_shortcut::Shortcut, _> = normalized_shortcut.parse();

    if let Ok(shortcutparsed) = shortcutparsed {
        // 尝试注销，但不报错（快捷键可能不存在）
        if let Err(e) = app.global_shortcut().unregister(shortcutparsed) {
            write_log(&format!("Global shortcut unregister failed: {}", e));
        }
    }

    Ok(())
}

// 注册切换语音识别快捷键
#[tauri::command]
async fn register_toggle_shortcut(
    app: tauri::AppHandle,
    shortcut: String,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    write_log(&format!("Registering toggle shortcut: {}", shortcut));

    // 转换快捷键格式：将 "Ctrl" 转换为 "CommandOrControl"
    let normalized_shortcut = shortcut
        .replace("Ctrl", "CommandOrControl")
        .replace("ctrl", "CommandOrControl");

    write_log(&format!("Normalized toggle shortcut: {}", normalized_shortcut));

    // 解析快捷键
    let shortcutparsed: Result<tauri_plugin_global_shortcut::Shortcut, _> = normalized_shortcut.parse();

    if let Ok(shortcutparsed) = shortcutparsed {
        // 先尝试注销现有的快捷键（如果存在）
        if let Err(e) = app.global_shortcut().unregister(shortcutparsed.clone()) {
            write_log(&format!("No existing toggle shortcut to unregister: {}", e));
        }

        let app_handle = app.clone();
        app.global_shortcut().on_shortcut(shortcutparsed, move |_app, _shortcut, _event| {
            write_log("Toggle shortcut triggered");

            // 触发前端事件，通知切换语音识别状态
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.emit("toggle-shortcut-triggered", ());
            }
        }).map_err(|e| e.to_string())?;
    } else {
        return Err(format!("Invalid shortcut format: {}", shortcut));
    }

    Ok(())
}

// 注销切换语音识别快捷键
#[tauri::command]
async fn unregister_toggle_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    write_log(&format!("Unregistering toggle shortcut: {}", shortcut));

    // 转换快捷键格式
    let normalized_shortcut = shortcut
        .replace("Ctrl", "CommandOrControl")
        .replace("ctrl", "CommandOrControl");

    let shortcutparsed: Result<tauri_plugin_global_shortcut::Shortcut, _> = normalized_shortcut.parse();

    if let Ok(shortcutparsed) = shortcutparsed {
        // 尝试注销，但不报错（快捷键可能不存在）
        if let Err(e) = app.global_shortcut().unregister(shortcutparsed) {
            write_log(&format!("Toggle shortcut unregister failed: {}", e));
        }
    }

    Ok(())
}

// 设置窗口尺寸
#[tauri::command]
async fn set_window_size(app: tauri::AppHandle, width: u32, height: u32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // 获取 DPI 缩放因子
        let scale_factor = window.scale_factor().map_err(|e| e.to_string())?;

        // 将逻辑像素转换为物理像素
        let physical_width = (width as f64 * scale_factor).round() as u32;
        let physical_height = (height as f64 * scale_factor).round() as u32;

        write_log(&format!("Setting window size to {}x{} (logical: {}x{}, scale: {})",
            physical_width, physical_height, width, height, scale_factor));

        window.set_size(tauri::Size::Physical(
            tauri::PhysicalSize::new(physical_width, physical_height)
        )).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 设置窗口是否可调整大小
#[tauri::command]
async fn set_window_resizable(app: tauri::AppHandle, resizable: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        write_log(&format!("Setting window resizable to {}", resizable));
        window.set_resizable(resizable).map_err(|e| e.to_string())?;
    }
    Ok(())
}


