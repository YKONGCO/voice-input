use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomRole {
    pub id: String,
    pub name: String,
    pub desc: String,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsData {
    pub api_key: String,
    pub api_url: String,
    pub model: String,
    pub language: String,
    pub system_prompt: String,
    pub selected_role: String,
    pub custom_roles: Vec<CustomRole>,
    pub auto_optimize: bool,
    pub auto_copy: bool,
    pub global_shortcut: String,
    pub toggle_shortcut: String,
    pub auto_voice_recognition: bool,
}

// 预设角色列表
pub fn get_role_prompts() -> Vec<(&'static str, &'static str)> {
    vec![
        ("1001", "你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。"),
        ("1002", "你是一个专业的翻译助手。请将用户输入的中文翻译成英文，保持原意，输出纯翻译内容不要添加解释。"),
        ("1003", "你是一个专业的翻译助手。请将用户输入的英文翻译成中文，保持原意，输出纯翻译内容不要添加解释。"),
        ("1004", "你是一个专业术语转换助手。请将用户输入的口语化表达转换为专业术语，保持原意但使用更专业的表达方式。"),
    ]
}

impl Default for SettingsData {
    fn default() -> Self {
        // 创建默认角色列表
        let default_roles = vec![
            CustomRole {
                id: "1001".to_string(),
                name: "文字润色".to_string(),
                desc: "修正标点、优化语句、分段处理".to_string(),
                prompt: "你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。".to_string(),
            },
            CustomRole {
                id: "1002".to_string(),
                name: "翻译成英文".to_string(),
                desc: "中文翻译为英文".to_string(),
                prompt: "你是一个专业的翻译助手。请将用户输入的中文翻译成英文，保持原意，输出纯翻译内容不要添加解释。".to_string(),
            },
            CustomRole {
                id: "1003".to_string(),
                name: "翻译成中文".to_string(),
                desc: "英文翻译为中文".to_string(),
                prompt: "你是一个专业的翻译助手。请将用户输入的英文翻译成中文，保持原意，输出纯翻译内容不要添加解释。".to_string(),
            },
            CustomRole {
                id: "1004".to_string(),
                name: "专业术语".to_string(),
                desc: "口语转专业术语".to_string(),
                prompt: "你是一个专业术语转换助手。请将用户输入的口语化表达转换为专业术语，保持原意但使用更专业的表达方式。".to_string(),
            },
        ];

        Self {
            api_key: String::new(),
            api_url: "https://api.openai.com/v1".to_string(),
            model: "gpt-3.5-turbo".to_string(),
            language: "zh-CN".to_string(),
            system_prompt: "你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。".to_string(),
            selected_role: "1001".to_string(),
            custom_roles: default_roles,
            auto_optimize: false,
            auto_copy: false,
            global_shortcut: String::new(),
            toggle_shortcut: String::new(),
            auto_voice_recognition: false,
        }
    }
}

fn get_config_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("voice-input");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

fn load_from_file() -> SettingsData {
    let path = get_config_path();
    if path.exists() {
        if let Ok(contents) = fs::read_to_string(&path) {
            if let Ok(mut settings) = serde_json::from_str::<SettingsData>(&contents) {
                // 如果 customRoles 为空，添加默认角色
                if settings.custom_roles.is_empty() {
                    settings.custom_roles = get_default_roles();
                }

                // 验证 selected_role 是否存在
                let default_ids = ["1001", "1002", "1003", "1004"];
                let role_exists = settings.custom_roles.iter().any(|r| r.id == settings.selected_role)
                    || default_ids.contains(&settings.selected_role.as_str());

                // 如果选中的角色不存在，重置为默认
                if !role_exists {
                    log::warn!("Selected role {} does not exist, resetting to '1001'", settings.selected_role);
                    settings.selected_role = "1001".to_string();
                }

                return settings;
            }
        }
    }
    SettingsData::default()
}

fn save_to_file(settings: &SettingsData) -> Result<(), String> {
    let path = get_config_path();
    let contents = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, contents).map_err(|e| e.to_string())?;
    Ok(())
}

pub struct Settings {
    config: Mutex<SettingsData>,
}

impl Settings {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(load_from_file()),
        }
    }

    pub fn get_config(&self) -> SettingsData {
        self.config.lock().unwrap().clone()
    }
}

// 获取设置
#[tauri::command]
pub fn get_settings(state: State<'_, Settings>) -> Result<SettingsData, String> {
    log::info!("Getting settings");
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

// 保存设置
#[tauri::command]
pub fn save_settings(mut settings: SettingsData, state: State<'_, Settings>) -> Result<(), String> {
    log::info!("Saving settings");

    // 验证 selected_role 是否存在
    let default_ids = ["1001", "1002", "1003", "1004"];
    let role_exists = settings.custom_roles.iter().any(|r| r.id == settings.selected_role)
        || default_ids.contains(&settings.selected_role.as_str());

    // 如果选中的角色不存在，重置为默认
    if !role_exists {
        log::warn!("Selected role {} does not exist, resetting to '1001'", settings.selected_role);
        settings.selected_role = "1001".to_string();
    }

    // 保存到文件
    save_to_file(&settings)?;
    // 更新内存中的配置
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    *config = settings;
    Ok(())
}

// 角色管理相关
fn get_default_roles() -> Vec<CustomRole> {
    vec![
        CustomRole {
            id: "1001".to_string(),
            name: "文字润色".to_string(),
            desc: "修正标点、优化语句、分段处理".to_string(),
            prompt: "你是一个专业的文字润色助手。请对用户输入的文字进行优化，包括：1. 修正标点符号；2. 优化语句通顺度；3. 分段处理；4. 保持原意但使表达更流畅。".to_string(),
        },
        CustomRole {
            id: "1002".to_string(),
            name: "翻译成英文".to_string(),
            desc: "中文翻译为英文".to_string(),
            prompt: "你是一个专业的翻译助手。请将用户输入的中文翻译成英文，保持原意，输出纯翻译内容不要添加解释。".to_string(),
        },
        CustomRole {
            id: "1003".to_string(),
            name: "翻译成中文".to_string(),
            desc: "英文翻译为中文".to_string(),
            prompt: "你是一个专业的翻译助手。请将用户输入的英文翻译成中文，保持原意，输出纯翻译内容不要添加解释。".to_string(),
        },
        CustomRole {
            id: "1004".to_string(),
            name: "专业术语".to_string(),
            desc: "口语转专业术语".to_string(),
            prompt: "你是一个专业术语转换助手。请将用户输入的口语化表达转换为专业术语，保持原意但使用更专业的表达方式。".to_string(),
        },
    ]
}

// 获取所有角色（从 customRoles 读取，包含默认角色）
#[tauri::command]
pub fn get_roles(state: State<'_, Settings>) -> Result<Vec<CustomRole>, String> {
    log::info!("Getting all roles");
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.custom_roles.clone())
}

// 添加自定义角色
#[tauri::command]
pub fn add_role(role: CustomRole, state: State<'_, Settings>) -> Result<(), String> {
    log::info!("Adding role: {:?}, name: '{}', prompt length: {}", role.id, role.name, role.prompt.len());

    // 验证角色名称不能为空
    if role.name.trim().is_empty() {
        return Err("角色名称不能为空".to_string());
    }

    // 验证提示词不能为空
    if role.prompt.trim().is_empty() {
        return Err("提示词不能为空".to_string());
    }

    // 验证角色 ID 不与默认角色冲突
    let default_ids = ["1001", "1002", "1003", "1004"];
    if default_ids.contains(&role.id.as_str()) {
        return Err("不能添加与默认角色ID重复的角色".to_string());
    }

    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.custom_roles.push(role);
    save_to_file(&config)?;
    Ok(())
}

// 更新角色
#[tauri::command]
pub fn update_role(role: CustomRole, state: State<'_, Settings>) -> Result<(), String> {
    log::info!("Updating role: {}", role.id);

    // 验证角色名称不能为空
    if role.name.trim().is_empty() {
        return Err("角色名称不能为空".to_string());
    }

    // 验证提示词不能为空
    if role.prompt.trim().is_empty() {
        return Err("提示词不能为空".to_string());
    }

    let mut config = state.config.lock().map_err(|e| e.to_string())?;

    // 检查是否是默认角色
    let default_ids = ["1001", "1002", "1003", "1004"];
    if default_ids.contains(&role.id.as_str()) {
        return Err("不能修改默认角色".to_string());
    }

    // 更新自定义角色
    if let Some(existing) = config.custom_roles.iter_mut().find(|r| r.id == role.id) {
        *existing = role;
        save_to_file(&config)?;
    } else {
        return Err("角色不存在".to_string());
    }
    Ok(())
}

// 删除角色
#[allow(non_snake_case)]
#[tauri::command]
pub fn delete_role(roleId: String, state: State<'_, Settings>) -> Result<(), String> {
    log::info!("Deleting role: {}", roleId);
    let mut config = state.config.lock().map_err(|e| e.to_string())?;

    // 检查是否是默认角色
    let default_ids = ["1001", "1002", "1003", "1004"];
    if default_ids.contains(&roleId.as_str()) {
        return Err("不能删除默认角色".to_string());
    }

    // 检查是否选中该角色，如果是则切换到默认角色
    if config.selected_role == roleId {
        config.selected_role = "1001".to_string();
    }

    // 删除自定义角色
    config.custom_roles.retain(|r| r.id != roleId);
    save_to_file(&config)?;
    Ok(())
}

// 设置选中的角色
#[allow(non_snake_case)]
#[tauri::command]
pub fn set_selected_role(roleId: String, state: State<'_, Settings>) -> Result<(), String> {
    log::info!("Setting selected role: {}", roleId);
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.selected_role = roleId;
    save_to_file(&config)?;
    Ok(())
}
