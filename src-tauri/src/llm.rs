use serde::{Deserialize, Serialize};
use tauri::State;
use crate::settings::{Settings, get_role_prompts};

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    content: String,
}

// 优化文本
#[tauri::command]
pub async fn optimize_text(text: String, state: State<'_, Settings>) -> Result<String, String> {
    log::info!("Optimizing text with LLM");

    let config = state.get_config();

    // 如果没有配置API Key，返回原始文本
    if config.api_key.is_empty() {
        return Err("请先在设置中配置API Key".to_string());
    }

    let client = reqwest::Client::new();

    // 获取选中的角色对应的提示词
    let role_prompts = get_role_prompts();

    // 先检查是否是自定义角色
    let system_prompt = if let Some(custom_role) = config.custom_roles.iter().find(|r| r.id == config.selected_role) {
        custom_role.prompt.clone()
    } else if let Some((_, prompt)) = role_prompts.iter().find(|(id, _)| *id == config.selected_role) {
        prompt.to_string()
    } else {
        config.system_prompt.clone()
    };

    let prompt = format!(
        "请优化以下文本，直接返回优化后的内容即可：\n{}",
        text
    );

    let request_body = OpenAIRequest {
        model: config.model.clone(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            Message {
                role: "user".to_string(),
                content: prompt,
            },
        ],
        temperature: 0.7,
    };

    let url = format!("{}/chat/completions", config.api_url);

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", config.api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("API请求失败: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API错误 ({}): {}", status, body));
    }

    let openai_response: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let optimized_text = openai_response
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or(text);

    log::info!("Text optimized successfully, result length: {}", optimized_text.len());
    log::debug!("Optimized text content: {}", optimized_text);
    Ok(optimized_text)
}
