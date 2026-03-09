# BuilderAI - AI驱动的软件开发工具

BuilderAI 是一个强大的 AI 驱动软件开发平台，能够根据用户的自然语言描述，自动生成完整的软件项目代码。

## ✨ 核心功能

- **自然语言驱动**：使用简单的自然语言描述即可生成完整的软件项目
- **高效架构**：优化的两阶段生成流程，仅需 2 次 LLM 调用
- **实时反馈**：通过 WebSocket 提供实时的构建进度和代码生成过程
- **完整项目**：生成包括前端、后端、配置文件等完整的项目结构
- **可定制化**：支持自定义 API 密钥、模型和基础 URL

## 🛠 技术栈

### 后端
- **语言**：Python 3.10+
- **框架**：FastAPI
- **通信**：WebSocket
- **LLM 集成**：OpenAI 兼容 API (默认使用阿里云 Dashscope Qwen 模型)

### 前端
- **框架**：React 18
- **语言**：TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **UI 组件**：Shadcn UI + Radix UI
- **状态管理**：React Query
- **路由**：React Router

## 📁 项目结构

```
├── app/
│   ├── backend/          # 后端代码
│   │   ├── agent.py      # 构建代理
│   │   ├── coder.py      # 代码生成器
│   │   ├── main.py       # FastAPI 主应用
│   │   ├── planner.py    # 项目规划器
│   │   ├── runner.py     # 构建运行器
│   │   ├── requirements.txt # 依赖项
│   │   └── projects/     # 生成的项目存储
│   └── frontend/         # 前端代码
│       ├── src/          # 源代码
│       ├── public/       # 静态文件
│       ├── package.json  # 前端依赖
│       └── vite.config.ts # Vite 配置
└── README.md            # 项目文档
```

## 🚀 快速开始

### 后端设置

1. **安装依赖**
   ```bash
   cd app/backend
   pip install -r requirements.txt
   ```

2. **启动后端服务**
   ```bash
   python main.py
   ```
   后端服务将在 `http://localhost:8000` 运行

### 前端设置

1. **安装依赖**
   ```bash
   cd app/frontend
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```
   前端将在 `http://localhost:5173` 运行

## ☁️ 部署指南

### 环境变量配置

在部署前端前，需要配置后端服务地址：

1. 复制示例配置文件：
   ```bash
   cp app/frontend/.env.production.example app/frontend/.env.production
   ```

2. 编辑 `.env.production`，修改后端地址：
   ```bash
   VITE_API_BASE_URL=http://你的后端服务器公网IP:8000
   ```

### 前端部署

1. **构建生产版本**
   ```bash
   cd app/frontend
   npm run build
   ```

2. **部署 dist 目录**
   
   构建完成后，会在 `app/frontend/dist/` 目录生成静态文件。将这些文件部署到任何静态文件服务器：

   - **Nginx/Apache**：将文件放到 web 根目录
   - **Vercel**：`vercel deploy dist`
   - **Netlify**：将 dist 文件夹拖入 Netlify
   - **阿里云 OSS/COS**：上传 dist 内容到存储桶

### 后端部署

1. **安装依赖**
   ```bash
   cd app/backend
   pip install -r requirements.txt
   ```

2. **启动服务**
   ```bash
   python main.py
   ```

3. **使用 PM2 管理（推荐）**
   ```bash
   npm install -g pm2
   pm2 start main.py --name builderai
   ```

### 防火墙配置

确保后端服务器的防火墙开放 8000 端口：
```bash
# Ubuntu/Debian
sudo ufw allow 8000

# CentOS
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## 🔧 配置

### API 配置

在前端界面中，您需要配置以下参数：

- **API Key**：您的 LLM API 密钥（必填）
- **Base URL**：API 基础 URL（默认：`https://coding.dashscope.aliyuncs.com/v1`）
- **Model**：使用的模型名称（默认：`qwen3.5-plus`）

### 环境变量

后端支持以下环境变量：

- `DEFAULT_BASE_URL`：默认 API 基础 URL
- `DEFAULT_MODEL`：默认模型名称

## 📖 使用指南

1. **打开前端应用**：访问 `http://localhost:5173`
2. **配置 API**：在设置页面输入您的 API 密钥
3. **输入项目描述**：在主界面输入您想要构建的项目描述，例如：
   > "构建一个待办事项应用，包含添加、删除、标记完成功能"
4. **开始构建**：点击 "Build" 按钮开始生成项目
5. **查看进度**：实时查看构建过程和生成的代码
6. **预览项目**：构建完成后，您可以预览生成的项目

## 🏗 架构设计

BuilderAI 采用优化的三阶段架构：

1. **Planner**（规划器）：分析用户提示，生成项目计划和文件结构（1 次 LLM 调用）
2. **Coder**（编码器）：根据计划批量生成所有文件的代码（1 次 LLM 调用）
3. **Runner**（运行器）：模拟构建和部署过程（0 次 LLM 调用）

总构建过程仅需 2 次 LLM 调用，大幅提高效率。

## 📡 API 接口

### 健康检查
- **端点**：`GET /health`
- **响应**：服务状态和版本信息

### 连接测试
- **端点**：`POST /api/test-connection`
- **请求体**：`{"api_key": "...", "base_url": "...", "model": "..."}`
- **响应**：连接测试结果

### WebSocket 构建
- **端点**：`WS /ws/build`
- **客户端发送**：`{"type": "start_build", "prompt": "...", "api_key": "...", "base_url": "...", "model": "..."}`
- **服务器流式返回**：构建状态、计划、文件树、代码内容等

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 打开 Pull Request

## 📄 许可证

本项目采用 xxx 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 支持

如有问题或建议，请通过以下方式联系我们：

- **GitHub Issues**：在本仓库提交 issue
- **电子邮件**：[yinmui.tai1998@outlook.com](yinmui.tai1998@outlook.com)

---

**BuilderAI** - 让 AI 为您构建软件！ 🚀