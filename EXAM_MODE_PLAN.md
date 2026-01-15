# 功能设计总览

## 概述
- 在现有 Practice Mode 基础上提供“模拟考试”体验：用户先输入考试题数，系统随机抽取指定数量进入作答。
- 界面与交互沿用 Practice Mode，但会话内所有题以“未作答”起始；提交后仍更新全局错题库与连对计数。
- 完成后展示本次考试的成绩统计与复盘入口。

## 目标与范围
- 目标：提供快速、沉浸的考试模拟，兼顾练习积累（错题库持续生效）。
- 范围：题目抽取、考试会话、答题提交与错题库更新、结果统计与复盘。
- 不含：计时器、暂停/续考、分卷结构等进阶功能（后续迭代）。

## 用户流程
- 入口：在考试详情页选择“Exam Mode”→输入题数（如 50）。
- 抽题：从该考试的全题库随机抽取 50 题生成会话并进入答题界面。
- 作答：逐题答题；题卡跳转、书签等沿用 Practice Mode。
- 完成：点击“提交试卷”或全部作答后进入结果页：展示正确数、错误数、未作答数、正确率与复盘入口。
- 复盘：查看本次错题清单或重新开启新的 Exam Mode。

## 路由与入口
- 建议路由：`/exams/$examId/exam`
- 查询参数：
  - `count`：题数
  - `seed`：随机种子（可选，便于复现）
  - `q`：当前题号（1-based）
  - `mode=exam`：用于界面层区分
- 路由与题号同步参考：[practice.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/routes/_authenticated/exams/$examId/practice.tsx) 与题号同步逻辑 [practice-mode.tsx:L236-L251](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L236-L251)。

## 题目选择
- 来源：该考试的 `allQuestions`（与 Practice Mode 相同加载流程 [practice-mode.tsx:L446-L509](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L446-L509)）。
- 抽样规则：
  - `count >= allQuestions.length`：选取全部；
  - 否则基于 `seed` 的可复现随机，进行无重复抽样；
  - 呈现按 `questionNumber` 升序，便于题卡映射与认知。
- Exam Mode 不做错题过滤；会话内初始状态全部未作答。

## UI/UX
- 复用 Practice Mode 布局与组件：
  - 桌面侧边栏题卡与设置：[practice-sidebar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-sidebar.tsx)
  - 移动端底栏：[practice-mobile-bar.tsx](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/components/practice-mobile-bar.tsx)
- 差异：
  - 头部标签显示“Exam Mode”
  - 隐藏“仅练错题”等错题模式专属控件
  - 增加“提交试卷”按钮与结果页
- 题卡仅显示本次会话抽取的题号；标记未作答/已作答/对/错与 Practice Mode 一致。

## 答题与错题库影响
- 会话内提交：在 `ExamSession` 中记录 `userSelection` 与 `isCorrect`，更新本次会话统计。
- 全局进度与错题库：
  - 提交后调用现有进度服务，更新 `status`、`consecutiveCorrect`、`timesWrong`；
  - 参考提交与持久化逻辑：[practice-mode.tsx:L575-L626](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L575-L626)、
    [progress-service.ts:L86-L125](file:///c:/Users/newbd/projects/dev/examtopics/src/services/progress-service.ts#L86-L125)、
    [firebase-progress.ts:L29-L62](file:///c:/Users/newbd/projects/dev/examtopics/src/services/firebase-progress.ts#L29-L62)。
- 错题毕业规则不区分模式：
  - 错答：`timesWrong+1`，`consecutiveCorrect=0`
  - 连对：`consecutiveCorrect+1`，达阈值（默认 3）后毕业并可重置 `timesWrong=0`
  - 过滤/毕业实现参考：[practice-mode.tsx:L260-L336](file:///c:/Users/newbd/projects/dev/examtopics/src/features/exams/practice-mode.tsx#L260-L336)。

## 结果页与复盘
- 展示：总题数、已作答、正确、错误、正确率。
- 复盘：本次错题列表入口（会话内错题或跳到 Practice 的错题模式），支持“重新开始一次 Exam Mode”（保留上次 `count` 与可选 `seed`）。

## 异常与边界
- 题数必须为正整数且 ≥1；若题库少于输入题数，提示并改为最大值。
- 数据加载失败：回退 `mock-exams` 或提示重试（沿用 Practice Mode 降级策略）。
- 移动端：底栏安全区与高度处理沿用现有实现（如 `env(safe-area-inset-bottom)`）。
- 登录态：会话不依赖登录；提交时区分本地/云端。

## 核心模块
- 考试管理（My Exams）：考试列表、详情与入口（Practice/Study/Mistakes/Exam）。
- Practice Mode：逐题作答、即时判分、题卡跳转与设置（Auto next、Font size、Consecutive correct）。
- Study Mode：展示正确答案与解释，题卡跳转与字体设置。
- My Mistakes：按错题池过滤；连对毕业阈值控制错题移出规则。
- Exam Mode：模拟考试（题数输入、随机抽题、会话统计与复盘）。
- 仪表盘（Dashboard）：近况与数据概览（可在后续扩展）。

## Practice Mode
- 路由：`/exams/$examId/practice`；支持 `?q=`（题号）与 `?mode=mistakes`。
- 交互：
  - 选择→提交→即时反馈（对/错与解释）。
  - 题卡跳转、书签切换；桌面侧边栏与移动端底栏适配。
- 设置：Auto next、Font size、Consecutive correct（错题毕业阈值）。
- 进度：提交后写入本地与云端（登录用户），影响错题计数与连对。

## Study Mode
- 路由：`/exams/$examId/study`
- 行为：高亮正确选项与解释区域；题卡跳转；字体设置。
- 不更新错题计数，仅用于内容学习。

## My Mistakes
- 入口：Exam 详情页“我的错题”；或 `practice?mode=mistakes`。
- 过滤：`status='incorrect'` 或 `timesWrong>0` 且 `consecutiveCorrect` 未达阈值。
- 毕业：在错题模式答对累计至阈值后，该题移出错题池并可清零 `timesWrong`。
- 会话标记：题卡以会话内的“未作答/对/错”标示。

## Exam Mode
- 入口：在考试详情页选择“Exam Mode”，先输入题数。
- 抽题：从全题库随机抽指定数量（可复现随机 `seed`），呈现按题号升序。
- 会话：题卡仅显示会话题号；会话内初始均为未作答。
- 提交：即时判分并更新会话统计；同时写入全局进度（错题与连对）。
- 结果：展示总题数、已作答、正确、错误、正确率；提供本次错题复盘与重新开始。

## 题库与渲染
- 优先加载 `public/data/{examId}.json`；无则回退到内置 mock。
- 题干与选项支持 HTML，图片路径按约定映射至 `/data/images/...`。
- 题型：单选与多选；多选提交前需满足选项数一致的校验。

## 进度与书签
- 本地：`localStorage`（按用户/考试/题目层级组织）。
- 云端：登录用户启用 Realtime DB 同步与订阅。
- 书签：保留于清空进度操作之外；Guest→User 合并遵循 OR 规则。
