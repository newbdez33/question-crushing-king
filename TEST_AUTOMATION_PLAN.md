# 自动化与回归测试实施计划（examtopics 前端）

## 目标与范围
- 建立稳定、可持续的自动化测试体系，覆盖单元、组件、集成与端到端。
- 将核心流程纳入回归测试集，保证每次发布的基本功能与关键指标不退化。
- 与现有技术栈（Vite + React + Tailwind + TanStack Router/Query）深度集成。

## 测试金字塔
- 单元/组件测试：数量最多，运行最快，覆盖纯函数、UI组件渲染与交互。
- 集成测试：验证模块间协作（路由、状态、数据层），适量。
 - E2E 测试：覆盖关键用户旅程与烟囱路径，数量少但稳定。

## 工具选型
- 单元/组件/集成：Vitest（与 Vite 原生集成）、React Testing Library、JSDOM。
- Mock：MSW（Mock Service Worker）在测试与开发环境统一拦截网络请求。
- 覆盖率：@vitest/coverage-v8（或 c8）。
- E2E：Playwright（跨浏览器、并行、快照/trace）。

## 初始化与安装步骤
- 安装单元/组件测试依赖

```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom @vitest/coverage-v8 msw
```

- 安装 E2E 测试依赖

```bash
pnpm add -D @playwright/test playwright
npx playwright install
```

## 配置建议
- 在 vite.config.ts 增加 test 配置

```ts
// vite.config.ts 片段示例
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
})
```

- 新增测试初始化文件 test/setup.ts

```ts
import '@testing-library/jest-dom/vitest'
```

- Playwright 基本配置（playwright.config.ts）

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
```

## 目录结构与命名规范
- src/**：业务代码
- src/**/__tests__/**：组件/模块邻近测试
- e2e/**：端到端测试
- test/setup.ts：Vitest 全局初始化
- 命名：组件测试采用 ComponentName.test.tsx；纯函数采用 util.test.ts。

## 编写用例指南
- 单元/组件
  - 仅断言对外可观察行为（文本、角色、ARIA、样式类变更），避免断言内部实现。
  - 优先使用 user-event 模拟交互，避免 fireEvent 过度使用。
  - 网络交互使用 MSW 拦截，在 beforeAll/afterAll 中启动/停止。
- 集成
  - 验证路由跳转、状态（Zustand/React Query）与组件协作。
  - 尽量在 JSDOM 环境下完成，避免引入浏览器特性依赖。
- E2E
  - 只覆盖关键路径：登录/登出、导航、核心表格操作、设置调整与保存。
  - 避免脆弱选择器，使用语义化定位（getByRole、label、data-testid）。
  - 将易变更区域降级为视觉快照或弱断言。

## Mock 与数据管理
- MSW 路由：为 axios/fetch 定义标准化 handlers；测试中以场景为单位注册。
- 测试数据：使用 @faker-js/faker 生成少量稳定基准数据；快照测试仅用于可控结构。
- 环境变量：测试环境独立 .env.test；严禁在测试中依赖真实密钥或生产地址。

## 覆盖率与质量门禁
- 阈值：Lines ≥ 80%，Functions ≥ 80%，Branches ≥ 75%。
- 在 CI 中启用覆盖率检查并作为门禁；低于阈值时阻止合并。

## 回归测试策略
- 冒烟集（Smoke）：在每次提交与预览环境部署触发，5–10 条核心旅程。
- 核心回归集：在合并到 main 前与 nightly 触发，覆盖所有关键模块。
- 标记策略：为测试用例添加标签（@smoke、@regression、@flaky）；在 CI 中按标签筛选。
- 变更影响选择：根据改动区域（路由/表格/设置）动态挑选相关测试子集。

## CI/CD 集成（示例）
- 触发：PR、main 合并、夜间计划任务。
- 任务：
  - Lint 与类型检查：pnpm lint、pnpm typecheck
  - 单元/集成测试：pnpm vitest run --coverage
  - E2E：pnpm playwright test
  - 报告：上传 coverage 与 Playwright artifacts（trace、screenshot、video）

## 里程碑与执行清单
- M1：接入 Vitest 与 RTL，完成 10 个核心组件用例与覆盖率门禁。
- M2：接入 MSW，覆盖查询与表单提交流程的集成测试。
- M3：接入 Playwright，完成 5 条 Smoke 与 8 条核心回归旅程。
- M4：打通 CI，按标签执行测试矩阵（浏览器 × 标签 × 环境）。
- M5：治理与维护，处理 flaky 用例，形成每周报告与问题清单。

## 常用命令

```bash
# 单元/集成（watch）
pnpm vitest
# 单次运行并生成覆盖率
pnpm vitest run --coverage
# 端到端
pnpm playwright test
# 只跑 Smoke（示例标签）
pnpm playwright test --grep @smoke
```

## 实施进展（当前仓库）
- 已接入 Vitest 配置，在 vite.config.ts 启用 jsdom、setupFiles 与覆盖率。
- 新增全局初始化 test/setup.ts，使用 @testing-library/jest-dom/vitest 扩展断言。
- 新增 Button 组件的基础测试用例（渲染、className 合并、点击交互）。
- 首次运行结果：通过 3/3 测试；生成 v8 覆盖率报告（示例：components/ui/button.tsx 为 100% 行/函数覆盖）。
- 后续计划：按组件邻近策略陆续补齐 Input、Switch、Config Drawer 等关键交互组件测试，并扩展到路由与状态的集成测试。

## 成功度量
- 每次发布前主干回归通过率 ≥ 99%，Smoke 平均耗时 ≤ 3 分钟。
- flaky 用例季度降低 ≥ 50%；关键页面首次输入延迟无显著退化。
