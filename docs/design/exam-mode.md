# 功能设计总览

## 概述

- 在现有 Practice Mode 基础上提供“随机抽题”体验：用户先输入考试题数，系统随机抽取指定数量进入作答。
- 当前实现沿用 Practice Mode 的逐题提交、即时判分、题卡、书签、字体设置、Auto next 与进度持久化。
- “提交试卷”、本次考试成绩统计、复盘入口、计时器属于后续迭代计划，当前尚未实现。

## 目标与范围

- 目标：提供快速随机练习入口，兼顾练习积累（错题库持续生效）。
- 当前范围：题目抽取、题号同步、逐题答题、即时判分、错题库与连对计数更新。
- 后续范围：整卷提交、结果页、复盘、计时器、暂停/续考、分卷结构。

## 用户流程

- 入口：在考试详情页选择“Exam Mode”→输入题数（如 50）和可选 seed。
- 抽题：从该考试的全题库随机抽取 50 题生成会话并进入答题界面。
- 作答：逐题答题并立即提交；题卡跳转、书签、字体设置、Auto next 等沿用 Practice Mode。
- 当前完成方式：没有整卷完成态；用户逐题查看即时反馈，进度写入本地/Firebase。
- 计划完成方式：点击“提交试卷”或全部作答后进入结果页，展示正确数、错误数、未作答数、正确率与复盘入口。
- 计划复盘：查看本次错题清单或重新开启新的 Exam Mode。

## 路由与入口

- 建议路由：`/exams/$examId/exam`
- 查询参数：
  - `count`：题数（可选；缺失时加载全部题）
  - `seed`：随机种子（可选，便于复现）
  - `q`：当前题号（1-based）
- 路由与题号同步参考：[src/routes/_authenticated/exams/$examId/practice.tsx](src/routes/_authenticated/exams/$examId/practice.tsx) 与题号同步逻辑 [src/features/exams/practice-mode.tsx](src/features/exams/practice-mode.tsx#L236-L251)。

## 题目选择

- 来源：该考试的 `allQuestions`（与 Practice Mode 相同加载流程 [src/features/exams/practice-mode.tsx](src/features/exams/practice-mode.tsx#L446-L509)）。
- 抽样规则：
  - `count >= allQuestions.length`：选取全部；
  - 否则基于 `seed` 的可复现随机，进行无重复抽样；
  - 呈现按 `questionNumber` 升序，便于题卡映射与认知。
- Exam Mode 不做错题过滤；会话内初始状态全部未作答。

## UI/UX

- 复用 Practice Mode 布局与组件：
  - 桌面侧边栏题卡与设置：[src/features/exams/components/practice-sidebar.tsx](src/features/exams/components/practice-sidebar.tsx)
  - 移动端底栏：[src/features/exams/components/practice-mobile-bar.tsx](src/features/exams/components/practice-mobile-bar.tsx)
- 当前差异：
  - 头部标签显示“Exam Mode”
  - 隐藏“仅练错题”等错题模式专属控件
  - 题卡仅显示本次抽取的题目集合
- 计划差异：
  - 增加“提交试卷”按钮与结果页
- 当前题卡颜色主要来自全局进度；后续整卷模式需要引入会话内未作答/已作答/对/错状态。

## 答题与错题库影响

- 当前逐题提交：复用进度服务记录 `userSelection` 与 `isCorrect`，并立即展示反馈。
- 计划会话提交：在 `ExamSession` 中记录 `userSelection` 与 `isCorrect`，更新本次会话统计。
- 全局进度与错题库：
  - 提交后调用现有进度服务，更新 `status`、`consecutiveCorrect`、`timesWrong`；
  - 参考提交与持久化逻辑：[src/features/exams/practice-mode.tsx](src/features/exams/practice-mode.tsx#L575-L626)、
    [src/services/progress-service.ts](src/services/progress-service.ts#L86-L125)、
    [src/services/firebase-progress.ts](src/services/firebase-progress.ts#L29-L62)。
- 错题毕业规则不区分模式：
  - 错答：`timesWrong+1`，`consecutiveCorrect=0`
  - 连对：`consecutiveCorrect+1`，达阈值（默认 3）后毕业并可重置 `timesWrong=0`
  - 过滤/毕业实现参考：[src/features/exams/practice-mode.tsx](src/features/exams/practice-mode.tsx#L260-L336)。

## 结果页与复盘（计划）

- 当前尚未实现专用结果页。
- 计划展示：总题数、已作答、正确、错误、未作答、正确率。
- 计划复盘：本次错题列表入口（会话内错题或跳到 Practice 的错题模式），支持“重新开始一次 Exam Mode”（保留上次 `count` 与可选 `seed`）。

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
- Exam Mode：随机抽题练习（题数输入、随机抽题、逐题即时判分）；整卷统计与复盘待实现。
- 仪表盘（Dashboard）：近况与数据概览（可在后续扩展）。
- Settings：保留 Profile/Account/Appearance；移除 Notifications 与 Display。Layout 设置通过全局 Config Drawer 与 Header 快捷控件统一入口。

## Settings 变更与 Layout 要素

- 目标
  - 去除 Settings 的 Notifications 与 Display 分区与相关路由、表单与保存逻辑。
  - Settings 与全局布局能力对齐：主题/侧栏形态/展开模式/方向统一由 Layout 要素驱动。
- 范围
  - 导航与路由：移除侧边导航与路由注册中的 Notifications 与 Display。
  - 表单与交互：删除通知偏好与侧栏显示项的表单。
  - Layout 要素说明与接入：统一通过 Layout Provider 与 Config Drawer 控制。
- Profile 与 Firebase 关联：Profile 页读取与编辑须与 Firebase 同步（详见下节）。
- 设计与实现要点
  - 导航与路由
    - 当前 Settings 侧边导航仅保留 Profile、Account、Appearance：
      - Settings 主页与侧边导航：[src/features/settings/index.tsx](src/features/settings/index.tsx)
    - Notifications 与 Display 已从当前源码树中移除，不再有对应页面容器、表单或路由。
  - Layout 要素（统一配置入口）
    - Theme：系统/明亮/暗黑，入口位于 Config Drawer 与 Header 的 ThemeSwitch
      - 参考：[src/components/config-drawer.tsx](src/components/config-drawer.tsx#L1-L354)、[src/features/settings/index.tsx](src/features/settings/index.tsx#L14-L21)
    - Sidebar Variant：inset/floating/sidebar，作用于 AppSidebar
      - 参考：[src/components/layout/app-sidebar.tsx](src/components/layout/app-sidebar.tsx#L1-L62)
    - Collapsible 展开模式：default/icon/offcanvas，支持移动端 Sheet 与 cookie 持久化
      - 参考：[src/context/layout-provider.tsx](src/context/layout-provider.tsx#L1-L85)、[src/components/ui/sidebar.tsx](src/components/ui/sidebar.tsx#L1-L728)
    - Direction：LTR/RTL，通过 DirConfig 控制
      - 参考：[src/components/config-drawer.tsx](src/components/config-drawer.tsx#L230-L290)
    - Reset Layout：一键重置 Theme/Dir/Layout 并打开侧栏
      - 参考：[src/components/config-drawer.tsx](src/components/config-drawer.tsx#L300-L340)
    - 侧栏开合快捷键：Ctrl/Cmd + B
      - 参考：[src/components/ui/sidebar.tsx](src/components/ui/sidebar.tsx#L74-L106)
  - Settings 页面改造
    - 页面布局继续使用固定布局容器以保证两列结构与内部滚动：
      - 主容器：[src/components/layout/main.tsx](src/components/layout/main.tsx#L1-L27)（`fixed`）
      - 适配固定高度：[src/components/layout/authenticated-layout.tsx](src/components/layout/authenticated-layout.tsx#L20-L34)
    - 保留分区：Profile、Account、Appearance
      - Appearance 聚焦主题设置；集成或复用 Header 的 ThemeSwitch，不在 Settings 内重复布局项
    - 移除分区：Notifications、Display（连同其表单与“Update”按钮）
  - 数据与持久化
    - 通知偏好不再由 Settings 管理；如后续需要采用独立通知中心/服务再行设计
    - 侧栏显示项（Display）不再可配；统一由 AppSidebar 导航源决定
    - Layout 状态通过 cookie/local 持久化（详见 Sidebar 与 LayoutProvider）
  - 回归与影响范围
    - 受影响页面：Settings 主页与其侧边导航、两处子页与对应路由
    - 不影响 Exam/Practice/Study/Mistakes 的功能与路由

## Profile 与 Firebase 关联

- 现状
  - 用户基础资料（displayName、photoURL、email）来源于 Firebase Auth 的 User 对象，通过 AuthContext 提供。
    - 参考：[src/context/auth-context.tsx](src/context/auth-context.tsx#L12-L50)、[src/context/auth-ctx.ts](src/context/auth-ctx.ts#L11-L19)
  - Settings › Profile 已与 Firebase 关联：读取 Auth User 基础资料，并通过 `user-profile` 服务读取/保存自定义资料字段。
    - 参考：[src/features/settings/profile/profile-form.tsx](src/features/settings/profile/profile-form.tsx)、[src/services/user-profile.ts](src/services/user-profile.ts)
- 目标
  - Profile 页持续与 Firebase 关联：读取与展示 Auth User 基础资料；支持编辑后更新至 Firebase。
  - 自定义资料字段（bio、urls、username 等）持久化到 Realtime DB 的 `users/{uid}/profile`。
- 读写规则
  - 读取
    - 基础资料：从 useAuth().user 读取 displayName、photoURL、email。
    - 自定义字段：从 `db` 读取 `users/{uid}/profile`（若不存在则使用默认空值）。
    - 参考 Firebase 初始化：[src/lib/firebase.ts](src/lib/firebase.ts#L1-L20)
  - 更新
    - 基础资料：调用 Firebase Auth API 更新
      - displayName/photoURL：`updateProfile(user, { displayName, photoURL })`
      - email：`updateEmail(user, email)`（需重新登录/近期登录校验）
    - 自定义字段：写入 `users/{uid}/profile`（bio、urls、username），采用幂等更新。
  - 容错与安全
    - 未登录用户：Profile 仅展示只读状态；不允许更新。
    - 匿名用户：允许填写自定义字段本地暂存，但不写入云端。
    - 权限：数据库规则应限制 `users/{uid}/profile` 仅允许该 uid 读写。
- UI/交互
  - 表单初始化：合并 Auth 基础资料与 DB 自定义字段为初始值。
  - 提交流程：先调用 Auth 更新（如需），再写入 DB 自定义字段；统一成功/失败提示。
  - 同步显示：提交成功后刷新 AuthContext 或本地状态，保证头部/侧边栏资料即时更新。
- 影响范围
  - 用户资料服务模块 `services/user-profile.ts` 供 Profile 表单复用。
  - 侧边栏与头像下拉显示名称与头像来源不变，但提交后需立即反映最新值：
    - 参考显示位置：[src/components/layout/app-sidebar.tsx](src/components/layout/app-sidebar.tsx#L21-L31)、[src/components/profile-dropdown.tsx](src/components/profile-dropdown.tsx#L18-L30)

## Practice Mode

- 路由：`/exams/$examId/practice`；支持 `?q=`（题号）与 `?mode=mistakes`。
- 交互：
  - 选择→提交→即时反馈（对/错与解释）。
  - 题卡跳转、书签切换；桌面侧边栏与移动端底栏适配。
- 设置：Auto next、Font size、Consecutive correct（错题毕业阈值）。
- 进度：提交后写入本地与云端（登录用户），影响错题计数与连对。

## Study Mode

- 路由：`/exams/$examId/study`
- 行为：高亮正确选项与解释区域；题卡跳题；字体设置。
- 不更新错题计数，仅用于内容学习。

## My Mistakes

- 入口：Exam 详情页“我的错题”；或 `practice?mode=mistakes`。
- 过滤：`status='incorrect'` 或 `timesWrong>0` 且 `consecutiveCorrect` 未达阈值。
- 毕业：在错题模式答对累计至阈值后，该题移出错题池并可清零 `timesWrong`。
- 会话标记：题卡以会话内的“未作答/对/错”标示。

## Exam Mode

- 入口：在考试详情页选择“Exam Mode”，先输入题数。
- 抽题：从全题库随机抽指定数量（可复现随机 `seed`），呈现按题号升序。
- 会话：题卡仅显示本次抽取的题目集合。
- 提交：即时判分；同时写入全局进度（错题与连对）。
- 计划：展示总题数、已作答、正确、错误、未作答、正确率；提供本次错题复盘与重新开始。

## 题库与渲染

- 优先加载 `public/data/{examId}.json`；无则回退到内置 mock。
- 题干与选项支持 HTML，图片路径按约定映射至 `/data/images/...`。
- 题型：单选与多选；多选提交前需满足选项数一致的校验。

## 进度与书签

- 本地：`localStorage`（按用户/考试/题目层级组织）。
- 云端：登录用户启用 Realtime DB 同步与订阅。
- 书签：保留于清空进度操作之外；Guest→User 合并遵循 OR 规则。

