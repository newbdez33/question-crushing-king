# Exam Topics Practice App

基于 Shadcn Admin Dashboard 的考试题库练习应用，支持加载本地 JSON 题库，提供多种练习和学习模式。

## 功能特性

- **题库管理** - 从 `/public/data` 加载 JSON 题库
- **练习模式** - 逐题作答，即时评分，导航切换
- **学习模式** - 展示正确答案和解析，支持书签
- **考试模式** - 模拟考试，随机抽题
- **错题本** - 针对错题进行强化练习
- **进度同步** - 支持 Firebase 跨设备同步

## 技术栈

| 类别 | 技术 |
|------|------|
| UI 框架 | React 19 + TypeScript |
| 组件库 | ShadcnUI (TailwindCSS + RadixUI) |
| 构建工具 | Vite 6 |
| 路由 | TanStack Router |
| 状态管理 | Zustand |
| 后端服务 | Firebase (Auth, Realtime Database) |
| 测试 | Vitest (单元测试), Playwright (E2E) |

## 快速开始

> **注意**: 本项目使用 `pnpm` 作为包管理器，请勿使用 npm 或 yarn。

```bash
# 克隆项目
git clone <your-repo-url>
cd examtopics

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置 Firebase 相关变量：

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=
```

## 项目结构

```
├── src/
│   ├── features/      # 功能模块
│   ├── components/    # 共享组件
│   ├── routes/        # 路由配置
│   ├── stores/        # 状态管理
│   ├── hooks/         # 自定义 Hooks
│   └── lib/           # 工具函数
├── public/data/       # 题库 JSON 和图片
└── docs/              # 项目文档
```

## 文档

详细文档请参阅 [docs/](./docs/index.md) 目录：

| 分类 | 文档 |
|------|------|
| **功能设计** | [功能规格](./docs/design/features.md) · [考试模式](./docs/design/exam-mode.md) · [我的考试](./docs/design/my-exams.md) |
| **技术实现** | [架构说明](./docs/technical/architecture.md) · [考试模式技术](./docs/technical/exam-mode.md) · [用户数据](./docs/technical/user-data.md) · [主题定制](./docs/technical/theme.md) |
| **测试** | [测试策略](./docs/testing/strategy.md) · [覆盖率计划](./docs/testing/coverage-plan.md) · [覆盖率报告](./docs/testing/coverage-results.md) |

## License

MIT
