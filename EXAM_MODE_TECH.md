# 技术实现与数据结构总览

## 架构与复用
- 复用 Practice Mode 的题目加载、题号同步、提交与持久化能力：
  - 数据加载与解析：[practice-mode.tsx:L446-L509](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L446-L509)
  - 题号与路由查询同步：[practice-mode.tsx:L236-L251](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L236-L251)
  - 提交与状态更新：[practice-mode.tsx:L575-L626](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L575-L626)
  - 错题过滤与毕业逻辑：[practice-mode.tsx:L260-L336](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L260-L336)
- UI 组件复用：
  - 侧边栏题卡与设置：[practice-sidebar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-sidebar.tsx)
  - 移动端底栏与安全区适配：[practice-mobile-bar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-mobile-bar.tsx)

## 路由与参数校验
- 路由：
  - Practice：`/exams/$examId/practice`
  - Study：`/exams/$examId/study`
  - Mistakes：`/exams/$examId/practice?mode=mistakes`
  - Exam：`/exams/$examId/exam`
- 查询参数：
  - `count: number`（必填，≥1）
  - `seed?: string`（可选）
  - `q?: number`（当前题号，1-based）
  - `mode=exam`（用于界面态标记）
- 校验风格沿用 Practice 路由定义：[practice.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/routes/_authenticated/exams/$examId/practice.tsx)。

## 数据结构
- ExamSession（仅本次会话内存态）：
  - `selectedQuestionIds: number[]`
  - `answers: Map<number, { userSelection: number[]; isCorrect: boolean }>`
  - `stats: { total: number; answered: number; correct: number; wrong: number }`
  - `createdAt: number`
  - `seed?: string`
  - `count: number`
- 全局进度（复用）：
  - 本地： [progress-service.ts](file:///c:/Users/newbd/projects/dev/examtopics/src/services/progress-service.ts)
  - 云端： [firebase-progress.ts](file:///c:/Users/newbd/projects/dev/examtopics/src/services/firebase-progress.ts)
  - 字段：`status`、`userSelection`、`lastAnswered`、`consecutiveCorrect`、`timesWrong`、`bookmarked`（详见 [USER_DATA.md](file:///c:/Users/newbd/projects/dev/examtopics/USER_DATA.md)）

## 题目加载与渲染
- 数据源：`public/data/{examId}.json`，无文件时回退 `src/features/exams/data/mock-exams.ts`。
- 解析：将 `correctAnswer` 的标签映射为选项索引；按 `questionNumber` 与选项 `label` 排序。
- HTML 渲染：题干与选项支持 HTML；图片 `images/...` 映射为 `/data/images/...`。
- 相关实现参考：[practice-mode.tsx:L446-L509](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L446-L509)。

## 抽样算法
- 输入：`allQuestions: PracticeQuestion[]`、`count: number`、`seed?: string`
- 规则：
  - `count >= allQuestions.length`：返回全部题
  - 否则使用基于 `seed` 的伪随机生成器（如 xorshift/LCG）对 `questionId` 无重复采样
  - 输出题号按 `questionNumber` 升序排序用于呈现
- 复现性：提供 `seed` 可复现抽样结果；无 `seed` 时使用时间戳作为默认种子。

## 提交与持久化
- 会话内提交：
  - 写入 `ExamSession.answers`，更新 `stats`
- 全局进度更新：
  - 本地：`ProgressService.saveAnswer(userIdOrGuestId, examId, questionId, payload)`
  - 云端（登录）：`RemoteProgress.saveAnswer(uid, examId, questionId, payload)`
  - 计数与毕业：
    - 正确：`consecutiveCorrect+1`；达到阈值后将题标记为已掌握并可清零 `timesWrong`
    - 错误：`consecutiveCorrect=0`，`timesWrong+1`
  - 参考实现：
    - 本地保存：[progress-service.ts:L86-L125](file:///c:/Users/newbd/projects/dev/examtopics/src/services/progress-service.ts#L86-L125)
    - 云端保存与计算：[firebase-progress.ts:L29-L62](file:///c:/Users/newbd/projects/dev/examtopics/src/services/firebase-progress.ts#L29-L62)

## 模式实现要点
- Practice：
  - 题号与路由同步；提交即时反馈与解释显示；Auto next 与底栏/侧边栏交互。
  - 题卡会话态颜色与全局进度解耦。
- Study：
  - 高亮正确选项与解释；不写入错题计数；题卡跳题与字体设置。
- My Mistakes：
  - 过滤集合由 `status/timesWrong` 与 `consecutiveCorrect` 阈值控制；毕业后移出池并可清零 `timesWrong`。
- Exam：
  - 抽样生成会话；仅对所选集合进行题卡与导航；结果统计与复盘列表来自会话。

## 结果页
- 数据来源：`ExamSession.stats` 与 `ExamSession.answers`
- 展示：总题数、已作答、正确、错误、正确率
- 复盘：
  - 本次错题清单：`answers` 中 `isCorrect=false` 的题目
  - 快捷入口：重新开始（保留或复写 `count` 与 `seed`）

## 设置与合并
- 连对阈值设置来源：
  - 读取与保存沿用 Practice 模式设置：[practice-mode.tsx:L406-L443](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L406-L443)、[practice-mode.tsx:L688-L704](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L688-L704)
- 进度合并与订阅：
  - 本地读取 + 远端订阅合并参考：[practice-mode.tsx:L342-L406](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L342-L406)

## 测试计划
- 单元：
  - 抽样：无重复、可复现、边界输入
  - 会话统计：提交后 `answered/correct/wrong` 更新正确
  - 进度更新：`timesWrong/consecutiveCorrect` 计数准确
- 集成：
  - 路由参数与 `q` 同步
  - 题卡与底栏仅显示会话题号
  - 结果页统计与错题复盘列表正确
- 手动：
  - 小/大题库、断网、登录/未登录、移动/桌面视图

## 代码参考
- Practice Mode 主组件与逻辑：[practice-mode.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx)
- 路由定义与参数校验：[practice.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/routes/_authenticated/exams/$examId/practice.tsx)
- 本地进度与设置：[progress-service.ts](file:///c:/Users/newbd/projects/dev/examtopics/src/services/progress-service.ts)
- 远端进度/设置同步：[firebase-progress.ts](file:///c:/Users/newbd/projects/dev/examtopics/src/services/firebase-progress.ts)
- 侧边栏与移动端底栏：[practice-sidebar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-sidebar.tsx)、[practice-mobile-bar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-mobile-bar.tsx)
