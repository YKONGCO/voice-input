# VoiceInput

Windows 语音输入软件 - 通过语音识别将语音转换为文字，并支持多种角色扮演和文本处理功能。

## 功能特性

- **语音识别**: 使用 Windows 原生语音识别 API，支持实时语音转文字
- **语音合成**: 支持语音播报识别结果
- **全局快捷键**: 支持自定义快捷键触发语音输入
- **角色扮演**: 内置多种预设角色，可自定义系统提示词
- **文本处理**: 自动标点、句首大写等文本处理功能
- **多语言支持**: 支持多种语言的语音识别
- **系统托盘**: 支持最小化到系统托盘
- **无边框窗口**: 简洁的悬浮窗设计

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Tauri 2 (Rust)
- **语音识别**: Windows Media Speech Recognition API
- **构建工具**: Vite

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- Windows 10/11 (语音识别功能需要 Windows)

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
# 启动前端开发服务器
npm run dev

# 启动 Tauri 开发模式
npm run tauri dev
```

## 构建

```bash
# 构建前端
npm run build

# 构建 Tauri 应用
npm run tauri build
```

## 项目结构

```
voice-input/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── base/           # 基础组件
│   │   ├── settings-components/ # 设置相关组件
│   │   └── voice-panel/   # 语音面板组件
│   ├── constants/          # 常量定义
│   ├── context/            # React Context
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # 服务层
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
├── src-tauri/              # Tauri/Rust 后端源码
│   ├── src/                # Rust 源码
│   ├── icons/              # 应用图标
│   └── tauri.conf.json     # Tauri 配置
├── dist/                   # 构建输出
└── node_modules/           # npm 依赖
```

## 配置

应用配置存储在本地，可通过设置界面修改：
- API 配置 (OpenAI API)
- 语音语言设置
- 文本处理选项
- 快捷键设置
- 角色管理

## 许可证

MIT
